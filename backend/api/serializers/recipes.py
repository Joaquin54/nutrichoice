from django.db import transaction
from rest_framework import serializers
from recipes.models import (
    Recipe,
    RecipeIngredient,
    RecipeInstruction
)
from api.serializers.ingredients import IngredientSerializer
from social.models import TriedRecipe


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
