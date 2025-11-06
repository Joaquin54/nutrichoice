from django.shortcuts import render
from django.db.models import QuerySet
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from typing import Optional
from .models import User, TriedRecipe
from .serializers import UserSerializer, TriedRecipeSerializer


class HealthView(APIView):
    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling user operations.
    Provides CRUD operations for User model.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'public_id'  # Use public_id instead of pk for lookups

    def get_queryset(self) -> QuerySet[User]:
        """
        Optionally restricts the returned users by filtering against
        query parameters in the URL.
        """
        queryset = User.objects.all()
        username: Optional[str] = self.request.query_params.get(
            'username', None)
        diet_type: Optional[str] = self.request.query_params.get(
            'diet_type', None)

        if username is not None:
            queryset = queryset.filter(username__icontains=username)
        if diet_type is not None:
            queryset = queryset.filter(diet_type=diet_type)

        return queryset

    @action(detail=True, methods=['get'])
    def tried_recipes(self, request: Request, public_id: Optional[str] = None) -> Response:
        """
        Returns all recipes tried by this user
        """
        user = self.get_object()
        tried_recipes = TriedRecipe.objects.filter(tried_by=user)
        serializer = TriedRecipeSerializer(tried_recipes, many=True)
        return Response(serializer.data)


class TriedRecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling tried recipes operations.
    Provides CRUD operations for TriedRecipe model.
    """
    queryset = TriedRecipe.objects.all()
    serializer_class = TriedRecipeSerializer
    lookup_field = 'public_id'

    def get_queryset(self) -> QuerySet[TriedRecipe]:
        """
        Optionally restricts the returned tried recipes by filtering against
        query parameters in the URL.
        """
        queryset = TriedRecipe.objects.all()
        user_id: Optional[str] = self.request.query_params.get('user_id', None)
        recipe_id: Optional[str] = self.request.query_params.get(
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
        most_tried = (TriedRecipe.objects
                      .values('recipe_id')
                      .annotate(try_count=Count('recipe_id'))
                      .order_by('-try_count')[:10])
        return Response(most_tried)
