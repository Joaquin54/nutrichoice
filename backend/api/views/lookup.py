from __future__ import annotations

from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request

from api.pagination import FeedPagination
from api.serializers.recipes import RecipeDetailSerializer
from recipes.services.lookup import RecipeLookupService


class RecipeLookupView(generics.ListAPIView):
  """
  GET /api/recipe-lookup/

  Returns a paginated, seeded-random-ordered list of recipes filtered by the
  authenticated user's dietary preferences and allergy exclusions.

  Query parameters:
    seed    (required) — Client UUID that pins the random ordering for this
                         session.  Must not be empty.
    search  (optional) — Free-text filter on recipe name, cuisine, and
                         ingredient names.
    diets   (optional) — Repeated parameter.  Presence of the key (even with
                         an empty value) overrides the user's profile diet prefs
                         for this request only.  Never written to the database.

  Permission: authenticated requests only.
  """

  serializer_class = RecipeDetailSerializer
  permission_classes = [IsAuthenticated]
  pagination_class = FeedPagination

  def get_queryset(self):  # type: ignore[override]
    q = self.request.query_params

    # seed is required — a missing or empty seed would produce unstable ordering.
    seed: str = q.get("seed") or ""
    if not seed:
      raise ValidationError({"seed": "Required."})

    search: str | None = q.get("search") or None

    # Presence of the 'diets' key — even as an empty string — signals an override.
    # Absence means "use the user's profile".
    diet_override: list[str] | None = (
      q.getlist("diets") if "diets" in q else None
    )

    return RecipeLookupService().build_lookup(
      user=self.request.user,
      search=search,
      seed=seed,
      diet_override=diet_override,
    )
