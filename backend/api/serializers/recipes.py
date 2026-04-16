import logging
from decimal import Decimal
from typing import TypedDict

from django.db import transaction
from rest_framework import serializers

from api.serializers.ingredients import IngredientSerializer
from nutrition.services import compute_and_store_nutrition
from nutrition.services.conversions import convert_from_grams, convert_to_grams
from recipes.models import Cookbook, CookbookRecipe, Recipe, RecipeIngredient, RecipeInstruction
from recipes.services.diet_tags import ALLOWED_DIET_KEYS, normalize_dietary_tags
from social.models import RecipeLike, TriedRecipe

logger = logging.getLogger(__name__)


class DisplayQuantity(TypedDict):
    ingredient: str
    quantity: str
    unit: str
    display_string: str


# --- Write serializers (used for input) ---

class RecipeIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit']


class RecipeInstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeInstruction
        fields = ['step_number', 'text', 'estimated_cooktime']


class CreateRecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True)
    instructions = RecipeInstructionSerializer(many=True)

    class Meta:
        model = Recipe
        fields = ['name', 'description', 'cuisine_type', 'dietary_tags', 'measure_type', 'servings', 'ingredients', 'instructions']

    def validate_ingredients(self, value):
        if not value:
            raise serializers.ValidationError("At least one ingredient is required.")
        return value

    def validate_instructions(self, value):
        if not value:
            raise serializers.ValidationError("At least one instruction step is required.")
        step_numbers = [s['step_number'] for s in value]
        if len(step_numbers) != len(set(step_numbers)):
            raise serializers.ValidationError("Step numbers must be unique.")
        return value

    def validate_dietary_tags(self, value: list[str]) -> list[str]:
        """
        Reject dietary tag values that are not in the canonical ALLOWED_DIET_KEYS set.

        Normalization (comma-splitting, lowercasing) is intentionally not applied here
        so that API clients learn to submit canonical keys rather than relying on silent
        coercion.  Unknown tags are surfaced as a descriptive 400 error.
        """
        normalized: list[str] = normalize_dietary_tags(value)
        unknown: set[str] = {tag for tag in value if tag not in ALLOWED_DIET_KEYS}
        if unknown:
            raise serializers.ValidationError(
                f"Unknown dietary tags: {sorted(unknown)}. "
                f"Allowed: {sorted(ALLOWED_DIET_KEYS)}."
            )
        return normalized

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients')
        instructions_data = validated_data.pop('instructions')
        with transaction.atomic():
            recipe = Recipe.objects.create(**validated_data)
            for item in ingredients_data:
                RecipeIngredient.objects.create(recipe=recipe, **item)
            for step in instructions_data:
                RecipeInstruction.objects.create(recipe=recipe, **step)
            compute_and_store_nutrition(recipe=recipe)
        return recipe


# --- Read serializers (used for responses) ---

class RecipeListSerializer(serializers.ModelSerializer):
    """
    Lightweight read serializer for recipe list views.
    Excludes nested ingredients, instructions, and the computed display_quantities
    field to minimise payload size and avoid expensive per-row serialization work.
    """

    creator = serializers.SerializerMethodField()

    def get_creator(self, obj: Recipe) -> str | None:
        """Username for display; avoid User.__str__ (public UUID) from StringRelatedField."""
        return obj.creator.username if obj.creator_id is not None else None

    class Meta:
        model = Recipe
        fields = [
            'id', 'name', 'description', 'cuisine_type', 'dietary_tags',
            'measure_type', 'servings', 'date_created', 'creator',
            'image_1', 'image_2', 'image_3',
        ]
        read_only_fields = fields


class RecipeIngredientDetailSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit']


class RecipeDetailSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientDetailSerializer(many=True, read_only=True)
    instructions = RecipeInstructionSerializer(many=True, read_only=True)
    creator = serializers.SerializerMethodField()
    display_quantities = serializers.SerializerMethodField()

    def get_creator(self, obj: Recipe) -> str | None:
        return obj.creator.username if obj.creator_id is not None else None

    class Meta:
        model = Recipe
        fields = [
            'id', 'name', 'description', 'cuisine_type', 'dietary_tags',
            'measure_type', 'servings', 'date_created', 'creator', 'ingredients',
            'instructions', 'display_quantities', 'image_1', 'image_2', 'image_3',
        ]
        read_only_fields = fields

    def get_display_quantities(self, obj: Recipe) -> list[DisplayQuantity]:
        """
        Convert each ingredient's stored quantity to the recipe's measure_type
        for display purposes.

        Uses pre-fetched ingredients via prefetch_related — no additional queries.
        """
        measure_type: str = obj.measure_type  # type: ignore[assignment]
        result: list[DisplayQuantity] = []
        count_units = frozenset({"count", "each", "whole"})

        for ri in obj.ingredients.all():  # type: ignore[union-attr]
            ingredient_name: str = ri.ingredient.name
            stored_unit: str = ri.unit.strip().lower()

            # Count-based items: skip volume conversion.
            if stored_unit in count_units or ri.ingredient.default_unit in count_units:
                if measure_type == "grams":
                    display = f"{int(Decimal(str(ri.quantity)).to_integral_value())}g {ingredient_name}"
                else:
                    display = f"{int(Decimal(str(ri.quantity)).to_integral_value())} {ingredient_name}"
                result.append(DisplayQuantity(
                    ingredient=ingredient_name,
                    quantity=str(ri.quantity),
                    unit=ri.unit,
                    display_string=display,
                ))
                continue

            # Grams mode: display raw values with gram formatting.
            if measure_type == "grams":
                qty_grams = convert_to_grams(
                    quantity=Decimal(str(ri.quantity)), unit=ri.unit,
                )
                rounded_grams = int(qty_grams.to_integral_value())
                result.append(DisplayQuantity(
                    ingredient=ingredient_name,
                    quantity=str(qty_grams),
                    unit="g",
                    display_string=f"{rounded_grams}g {ingredient_name}",
                ))
                continue

            # Volume mode: convert to grams first, then to target unit.
            try:
                qty_grams = convert_to_grams(
                    quantity=Decimal(str(ri.quantity)), unit=ri.unit,
                )
                conversion = convert_from_grams(
                    grams=qty_grams,
                    target_unit=measure_type,
                    ingredient_name=ingredient_name,
                )
                gram_display = int(qty_grams.to_integral_value())
                display = f"{conversion.display_string} ({gram_display}g) {ingredient_name}"
                result.append(DisplayQuantity(
                    ingredient=ingredient_name,
                    quantity=str(conversion.quantity),
                    unit=conversion.unit,
                    display_string=display,
                ))
            except ValueError as exc:
                logger.warning(
                    "Conversion error for %s in recipe %s: %s",
                    ingredient_name, obj.pk, exc,
                )
                result.append(DisplayQuantity(
                    ingredient=ingredient_name,
                    quantity=str(ri.quantity),
                    unit=ri.unit,
                    display_string=f"{ri.quantity} {ri.unit} {ingredient_name}",
                ))

        return result


class TriedRecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriedRecipe
        fields = [
            "public_id",
            "recipe",
            "date_added",
            "tried_by",
        ]
        read_only_fields = ["public_id", "date_added"]

    def validate(self, data):
        recipe = data.get("recipe")
        tried_by = data.get("tried_by")

        queryset = TriedRecipe.objects.filter(
            recipe=recipe, tried_by=tried_by)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Recipe already tried by this user"
            )

        return data


class RecipeLikeSerializer(serializers.ModelSerializer):
    """
    Input/output serializer for RecipeLike.
    The 'user' field is intentionally excluded — it is injected by the view
    via perform_create(serializer.save(user=request.user)).
    Duplicate-like detection is performed here using request context so that
    the correct HTTP 400 is raised before the database constraint fires.
    """

    class Meta:
        model = RecipeLike
        fields = ["id", "recipe", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, data: dict) -> dict:
        """Reject a like if the user has already liked this recipe."""
        user = self.context["request"].user
        recipe = data.get("recipe")

        if RecipeLike.objects.filter(user=user, recipe=recipe).exists():
            raise serializers.ValidationError(
                "You have already liked this recipe."
            )

        return data


# --- Write serializers (used for input) ---

class CookbookRecipeAddSerializer(serializers.Serializer):
    """
    Input-only serializer for the add-recipe action.
    Accepts a plain integer recipe_id; existence and ownership checks
    are delegated to the view so that the correct 404/403 status codes
    are returned (rather than the generic 400 from field-level validation).
    """

    recipe_id = serializers.IntegerField()


# --- Read serializers (used for responses) ---

class CookbookSerializer(serializers.ModelSerializer):
    """
    Lightweight cookbook serializer used for list and create responses.
    Does not include nested recipe detail — use CookbookDetailSerializer
    for the retrieve action.
    """

    owner_username = serializers.CharField(source="owner.username", read_only=True)
    recipe_count = serializers.SerializerMethodField()

    class Meta:
        model = Cookbook
        fields = [
            "id",
            "public_id",
            "name",
            "owner_username",
            "recipe_count",
            "date_created",
            "date_updated",
        ]
        read_only_fields = [
            "id",
            "public_id",
            "owner_username",
            "recipe_count",
            "date_created",
            "date_updated",
        ]

    def get_recipe_count(self, obj: Cookbook) -> int:
        """
        Return the number of recipes in this cookbook.
        Uses the annotated_recipe_count from the queryset when available
        (one COUNT per queryset rather than one per row).
        """
        if hasattr(obj, "annotated_recipe_count"):
            return obj.annotated_recipe_count  # type: ignore[attr-defined]
        return obj.cookbook_recipes.count()  # type: ignore[attr-defined]

    def validate_name(self, value: str) -> str:
        """
        Reject the name if the requesting user already owns a cookbook
        with the same name. Checked here (not only at the DB constraint)
        so that a descriptive 400 is returned rather than an IntegrityError.
        """
        user = self.context["request"].user
        queryset = Cookbook.objects.filter(owner=user, name=value)

        # Exclude current instance on updates so rename-to-same-name is allowed.
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "You already have a cookbook with this name."
            )

        return value


class CookbookDetailSerializer(serializers.ModelSerializer):
    """
    Full cookbook serializer used for the retrieve action.
    Includes all recipe detail (ingredients, instructions, creator) via
    the existing RecipeDetailSerializer. The queryset on the view must
    use prefetch_related('cookbook_recipes__recipe') to avoid N+1 queries.
    """

    owner_username = serializers.CharField(source="owner.username", read_only=True)
    recipe_count = serializers.SerializerMethodField()
    recipes = serializers.SerializerMethodField()

    class Meta:
        model = Cookbook
        fields = [
            "id",
            "public_id",
            "name",
            "owner_username",
            "recipe_count",
            "date_created",
            "date_updated",
            "recipes",
        ]
        read_only_fields = fields

    def get_recipe_count(self, obj: Cookbook) -> int:
        """
        Return the number of recipes in this cookbook.
        Uses the annotated_recipe_count from the queryset when available
        (one COUNT per queryset rather than one per row).
        """
        if hasattr(obj, "annotated_recipe_count"):
            return obj.annotated_recipe_count  # type: ignore[attr-defined]
        return obj.cookbook_recipes.count()  # type: ignore[attr-defined]

    def get_recipes(self, obj: Cookbook) -> list:
        """
        Return full recipe detail for every recipe in the cookbook.
        Relies on prefetched 'cookbook_recipes__recipe' to avoid N+1 queries.
        """
        recipe_instances = [cr.recipe for cr in obj.cookbook_recipes.all()]
        return RecipeDetailSerializer(
            recipe_instances,
            many=True,
            context=self.context,
        ).data
