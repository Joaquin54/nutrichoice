from rest_framework import serializers
from recipes.models import (
    Recipe,
    RecipeIngredient,
    RecipeInstruction
)
from ingredients.models import Ingredient
from social.models import (
    RecipeReview,
    UserFollow,
    UserBlock,
    PostRecipe,
    TriedRecipe
)


class TriedRecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriedRecipe
        fields = [
            "public_id",
            "recipe_id",  # ADDED: This was missing but is required in the model
            "date_added",
            "tried_by",
        ]
        read_only_fields = ["public_id", "date_added"]

    # Object-level validation
    # See https://www.django-rest-framework.org/api-guide/serializers/#object-level-validation
    def validate(self, data):
        # FIXED: The original validation was checking public_id which doesn't make sense
        # The unique_together constraint is on (tried_by, recipe_id)
        recipe_id = data.get("recipe_id")
        tried_by = data.get("tried_by")

        # Exclude current instance if updating
        queryset = TriedRecipe.objects.filter(
            recipe_id=recipe_id, tried_by=tried_by)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Recipe already tried by this user"
            )

        return data
