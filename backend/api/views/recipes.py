from typing import Optional

from django.db import IntegrityError
from django.db.models import QuerySet
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from api.serializers.recipes import (
    CookbookDetailSerializer,
    CookbookRecipeAddSerializer,
    CookbookSerializer,
    CreateRecipeSerializer,
    RecipeDetailSerializer,
    RecipeLikeSerializer,
    TriedRecipeSerializer,
)
from ingredients.models import Ingredient
from recipes.models import Cookbook, CookbookRecipe, Recipe, RecipeIngredient, RecipeInstruction
from social.models import RecipeLike, TriedRecipe


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


class RecipeLikeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for liking and unliking recipes.

    Supported actions:
      GET    /recipe-likes/        — list the current user's likes
      POST   /recipe-likes/        — like a recipe
      DELETE /recipe-likes/{id}/   — unlike a recipe

    PUT and PATCH are disabled; a like has no mutable fields.
    """

    serializer_class = RecipeLikeSerializer
    permission_classes = [IsAuthenticated]
    # Restrict to list / create / destroy — no update semantics.
    http_method_names = ["get", "post", "delete", "head", "options"]

    # DRF introspection hint; get_queryset() enforces the real scope.
    queryset = RecipeLike.objects.all()  # type: ignore

    def get_queryset(self) -> QuerySet[RecipeLike]:  # type: ignore
        """Return only the current user's likes."""
        return RecipeLike.objects.filter(user=self.request.user)  # type: ignore

    def perform_create(self, serializer: RecipeLikeSerializer) -> None:
        """Associate the like with the requesting user."""
        serializer.save(user=self.request.user)

    def create(self, request: Request, *args, **kwargs) -> Response:
        """
        Like a recipe.

        Errors:
          404 — recipe does not exist
          400 — recipe already liked by this user (caught in serializer.validate)
        """
        recipe_id = request.data.get("recipe")
        if recipe_id is not None:
            try:
                Recipe.objects.get(pk=recipe_id)  # type: ignore
            except Recipe.DoesNotExist:
                raise NotFound("Recipe not found.")

        return super().create(request, *args, **kwargs)


class CookbookViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing a user's cookbooks.

    Supported actions (all scoped to the requesting user's cookbooks):
      GET    /cookbooks/                          — list
      POST   /cookbooks/                          — create
      GET    /cookbooks/{public_id}/              — retrieve with nested recipes
      PUT    /cookbooks/{public_id}/              — full update (name only)
      PATCH  /cookbooks/{public_id}/              — partial update (name)
      DELETE /cookbooks/{public_id}/              — delete cookbook
      POST   /cookbooks/{public_id}/add-recipe/   — add a recipe to the cookbook
      DELETE /cookbooks/{public_id}/remove-recipe/— remove a recipe from the cookbook
    """

    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"

    # DRF introspection hint; get_queryset() enforces the real scope.
    queryset = Cookbook.objects.all()  # type: ignore

    def get_queryset(self) -> QuerySet[Cookbook]:  # type: ignore
        """
        Return only the cookbooks owned by the requesting user,
        pre-fetching nested recipe relations to avoid N+1 queries
        on retrieve and custom actions.
        """
        return (
            Cookbook.objects  # type: ignore
            .filter(owner=self.request.user)
            .prefetch_related("cookbook_recipes__recipe__ingredients__ingredient",
                              "cookbook_recipes__recipe__instructions")
        )

    def get_serializer_class(self):
        """
        Use the full detail serializer (with nested recipes) only on retrieve.
        All other actions use the lightweight CookbookSerializer.
        """
        if self.action == "retrieve":
            return CookbookDetailSerializer
        return CookbookSerializer

    def perform_create(self, serializer: CookbookSerializer) -> None:
        """
        Set the owner to the requesting user.

        Errors:
          400 — caught here if a race condition produces an IntegrityError
                after the serializer-level duplicate-name check passed.
        """
        try:
            serializer.save(owner=self.request.user)
        except IntegrityError:
            raise DRFValidationError(
                "A cookbook with this name already exists."
            )

    @action(detail=True, methods=["post"], url_path="add-recipe")
    def add_recipe(self, request: Request, public_id: str = None) -> Response:
        """
        Add a recipe to this cookbook.

        The requesting user must own the recipe OR have liked it.

        Errors:
          404 — cookbook not found (handled by get_object / scoped queryset)
          400 — recipe_id missing or malformed
          404 — recipe does not exist
          403 — user neither owns nor has liked the recipe
          400 — recipe is already in this cookbook
        """
        cookbook = self.get_object()

        input_serializer = CookbookRecipeAddSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        recipe_id: int = input_serializer.validated_data["recipe_id"]

        # Validate recipe existence.
        try:
            recipe = Recipe.objects.get(pk=recipe_id)  # type: ignore
        except Recipe.DoesNotExist:
            raise NotFound("Recipe not found.")

        # Validate ownership or like.
        user_owns: bool = recipe.creator_id == request.user.pk
        user_liked: bool = RecipeLike.objects.filter(  # type: ignore
            user=request.user, recipe=recipe
        ).exists()

        if not user_owns and not user_liked:
            raise PermissionDenied(
                "You can only add recipes you have created or liked."
            )

        # Validate recipe not already in cookbook.
        if CookbookRecipe.objects.filter(  # type: ignore
            cookbook=cookbook, recipe=recipe
        ).exists():
            raise DRFValidationError("This recipe is already in the cookbook.")

        CookbookRecipe.objects.create(cookbook=cookbook, recipe=recipe)  # type: ignore

        # Re-fetch the cookbook instance to reflect the new recipe in the response.
        cookbook.refresh_from_db()
        response_serializer = CookbookDetailSerializer(
            cookbook, context={"request": request}
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="remove-recipe")
    def remove_recipe(self, request: Request, public_id: str = None) -> Response:
        """
        Remove a recipe from this cookbook.

        Errors:
          404 — cookbook not found (handled by get_object / scoped queryset)
          400 — recipe_id missing from request body
          404 — recipe is not in this cookbook
        """
        cookbook = self.get_object()

        recipe_id = request.data.get("recipe_id")
        if not recipe_id:
            raise DRFValidationError("recipe_id is required.")

        try:
            cr = CookbookRecipe.objects.get(  # type: ignore
                cookbook=cookbook, recipe_id=recipe_id
            )
        except CookbookRecipe.DoesNotExist:
            raise NotFound("Recipe not found in this cookbook.")

        cr.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
