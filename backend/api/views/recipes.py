from rest_framework import viewsets, status, generics
from django.db.models import QuerySet
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from typing import Optional
from recipes.models import (
    Recipe,
    RecipeIngredient,
    RecipeInstruction
)
from ingredients.models import Ingredient
from social.models import TriedRecipe
from api.serializers.recipes import (
    TriedRecipeSerializer,
    CreateRecipeSerializer,
    RecipeDetailSerializer
)


class RecipeCreateView(generics.CreateAPIView):
    queryset = Recipe.objects.all()
    serializer_class = CreateRecipeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        return serializer.save(creator=self.request.user)

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipe = self.perform_create(serializer)
        response_serializer = RecipeDetailSerializer(recipe)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class TriedRecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling tried recipes operations.
    Provides CRUD operations for TriedRecipe model.
    """
    queryset = TriedRecipe.objects.all()  # type: ignore
    serializer_class = TriedRecipeSerializer
    lookup_field = 'id'

    def get_queryset(self) -> QuerySet[TriedRecipe]:  # type: ignore
        """
        Optionally restricts the returned tried recipes by filtering against
        query parameters in the URL.
        """
        queryset = TriedRecipe.objects.all()  # type: ignore
        user_id: Optional[str] = self.request.query_params.get(
            'user_id', None)  # type: ignore
        recipe_id: Optional[str] = self.request.query_params.get(  # type: ignore
            'recipe_id', None)

        if user_id is not None:
            queryset = queryset.filter(tried_by__public_id=user_id)
        if recipe_id is not None:
            queryset = queryset.filter(recipe_id=recipe_id)

        return queryset

    def perform_create(self, serializer: TriedRecipeSerializer) -> None:
        """
        Associate the tried recipe with the current user when creating
        """
        serializer.save(tried_by=self.request.user)

    @action(detail=False, methods=['get'])
    def most_tried(self, request: Request) -> Response:
        """
        Returns the most tried recipes
        """
        from django.db.models import Count
        most_tried = (TriedRecipe.objects  # type: ignore
                      .values('recipe_id')
                      .annotate(try_count=Count('recipe_id'))
                      .order_by('-try_count')[:10])
        return Response(most_tried)
