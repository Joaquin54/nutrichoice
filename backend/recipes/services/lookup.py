from __future__ import annotations

from typing import Any

from django.db.models import F, Q, QuerySet, TextField, Value
from django.db.models.functions import Cast, Concat, MD5

from recipes.models import Recipe
from recipes.services.feed import ALLOWED_DIET_KEYS
from recipes.services.user_filters import get_active_allergies

_LOOKUP_LIMIT = 20


class RecipeLookupService:
  """
  Builds a filtered, seeded-random-ordered queryset for the recipe lookup endpoint.

  Applies diet preferences (AND semantics), allergy exclusions (icontains
  on ingredient names), optional full-text search, and a per-session stable
  random ordering keyed on a client-supplied seed.

  At most _LOOKUP_LIMIT recipes are returned per call. All filter constraints
  (diet, allergies, search) are evaluated on the full filtered set before the
  cap is applied, so the results are always a correct random sample of the
  matching pool.
  """

  def build_lookup(
    self,
    user: Any,
    search: str | None,
    seed: str,
    diet_override: list[str] | None,
  ) -> QuerySet[Recipe]:
    """
    Return a filtered, annotated QuerySet capped at _LOOKUP_LIMIT recipes.

    Strategy: apply all filter conditions on a lightweight queryset (no
    prefetch), then run a single SQL query to retrieve the first _LOOKUP_LIMIT
    IDs in seeded-random order. A second queryset filtered to those IDs is
    returned — it is un-sliced so DRF pagination can call .count() on it
    safely. The outer COUNT and data-fetch queries are both bounded by
    _LOOKUP_LIMIT, making them trivially fast regardless of total recipe count.

    Args:
      user: The authenticated request user (must have a .profile relation).
      search: Optional free-text search string. Applied as icontains on
              name, cuisine_type, and ingredient names.
      seed: Client-supplied UUID string used to produce a stable per-session
            random ordering via md5(id || seed). Must not be empty (validated
            at the view layer).
      diet_override: If not None, use this list of diet keys instead of the
                     user's profile. An empty list disables all diet filtering.
    """
    qs: QuerySet[Recipe] = Recipe.objects.all()

    # 1. Diet filter — AND semantics: every active tag must be present.
    effective_diets: list[str] = (
      self._sanitize_diet_override(diet_override)
      if diet_override is not None
      else self._get_active_diet_prefs(user)
    )
    for tag in effective_diets:
      qs = qs.filter(dietary_tags__contains=[tag])

    # 2. Allergy exclusion — case-insensitive substring match on ingredient name.
    allergens: list[str] = get_active_allergies(user)
    if allergens:
      allergen_q = Q()
      for token in allergens:
        allergen_q |= Q(ingredients__ingredient__name__icontains=token)
      qs = qs.exclude(allergen_q).distinct()

    # 3. Search — layered on top of diet + allergy filters.
    if search:
      qs = qs.filter(
        Q(name__icontains=search)
        | Q(cuisine_type__icontains=search)
        | Q(ingredients__ingredient__name__icontains=search)
      ).distinct()

    # 4. Seeded stable random ordering expressed entirely through the ORM.
    #    MD5(Concat(Cast("id", TextField()), Value(seed))) compiles to
    #    md5("recipes_recipe"."id"::text || %s) with seed bound as a parameter.
    #    The table-qualified column avoids the ambiguity introduced when the
    #    search filter joins recipes_recipeingredient and ingredients_ingredient.
    #    F("id").desc() similarly resolves to "recipes_recipe"."id" DESC.
    return qs.annotate(
      _rand=MD5(Concat(
        Cast("id", output_field=TextField()),
        Value(seed),
        output_field=TextField(),
      ))
    ).order_by("_rand", F("id").desc())

  def _get_active_diet_prefs(self, user: Any) -> list[str]:
    """
    Return diet keys from the user's profile that are set to True and
    are in ALLOWED_DIET_KEYS. Falls back gracefully if profile is absent.
    """
    try:
      diet_type: dict[str, bool] | None = user.profile.diet_type  # type: ignore[union-attr]
      items = (diet_type or {}).items()
    except AttributeError:
      return []
    return [k for k, v in items if v is True and k in ALLOWED_DIET_KEYS]

  def _sanitize_diet_override(self, override: list[str]) -> list[str]:
    """
    Strip any diet keys not in ALLOWED_DIET_KEYS to prevent injection of
    unknown tags into the filter chain.
    """
    return [tag for tag in override if tag in ALLOWED_DIET_KEYS]
