from rest_framework import serializers
from ingredients.models import Ingredient


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = [
            "id",
            "name",
            "calories_per_100g",
            "protein_per_100g",
            "carbs_per_100g",
            "fat_per_100g",
            "fiber_per_100g",
            "sugar_per_100g",
            "sodium_per_100g",
            "default_unit",
        ]
        read_only_fields = fields
