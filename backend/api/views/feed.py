from django.db.models import QuerySet
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from api.pagination import FeedPagination
from api.serializers.recipes import RecipeDetailSerializer
from recipes.models import Recipe
from recipes.services.feed import RecipeFeedService


class RecipeFeedView(generics.ListAPIView):
    """
    GET /api/recipe-feed/

    Returns a paginated, personalized list of recipes for the authenticated user.

    Scoring signals (highest priority first):
      1. Recipes from followed creators
      2. Recipes whose ingredients overlap with the user's tried-recipe history
      3. Most-liked recipes (global popularity fallback)
      4. Newest recipes (tiebreaker)

    Filters applied automatically:
      - Recipes from blocked creators are excluded.
      - Recipes the user has already tried are excluded.
      - If the user has active dietary preferences set on their profile,
        only recipes matching all active tags are returned.

    Pagination:
      - Default page size: 20  (override with ?page_size=N, max 50)
      - Navigate pages with ?page=N
    """

    serializer_class = RecipeDetailSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = FeedPagination

    def get_queryset(self) -> QuerySet[Recipe]:  # type: ignore[override]
        return RecipeFeedService().build_feed(self.request.user)
