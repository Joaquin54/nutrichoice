from recipes.models import (
    RecipeIngredient,
    Recipe,
    RecipeInstruction)
from rest_framework import (
    views,
    viewsets,
    generics)
from serializers.recipes import CreateRecipeSerializer


class CreateRecipe(generics.CreateAPIView):
