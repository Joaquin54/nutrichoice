from django.db import transaction
from rest_framework import serializers

from api.serializers.ingredients import IngredientSerializer
from nutrition.services import compute_and_store_nutrition
from recipes.models import Cookbook, CookbookRecipe, Recipe, RecipeIngredient, RecipeInstruction
from social.models import RecipeLike, TriedRecipe


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
        fields = ['name', 'description', 'cuisine_type', 'dietary_tags', 'ingredients', 'instructions']

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

class RecipeIngredientDetailSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit']


class RecipeDetailSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientDetailSerializer(many=True, read_only=True)
    instructions = RecipeInstructionSerializer(many=True, read_only=True)
    creator = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'name', 'description', 'cuisine_type', 'dietary_tags', 'date_created', 'creator', 'ingredients', 'instructions']
        read_only_fields = fields


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
        """Return the number of recipes currently in this cookbook."""
        return obj.cookbook_recipes.count()

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
        """Return the number of recipes currently in this cookbook."""
        return obj.cookbook_recipes.count()

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
