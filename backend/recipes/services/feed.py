from __future__ import annotations

from django.db.models import (
    Case,
    Count,
    IntegerField,
    Q,
    QuerySet,
    Value,
    When,
)

from recipes.models import Recipe, RecipeIngredient
from social.models import TriedRecipe, UserBlock, UserFollow
from users.models import User


# Canonical set of allowed dietary preference keys.
# Each key must correspond to a value that can appear in Recipe.dietary_tags.
ALLOWED_DIET_KEYS: frozenset[str] = frozenset({
    "vegetarian",
    "vegan",
    "gluten_free",
    "dairy_free",
    "nut_free",
    "keto",
    "paleo",
    "low_carb",
})


class RecipeFeedService:
    """
    Builds a personalized recipe feed queryset for a given user.

    Scoring signals (all computed in a single annotated SQL query):
      - is_from_followed : 1 if the recipe creator is followed by the user, else 0
      - ingredient_overlap: count of recipe ingredients that appear in the
                            ingredients from recipes the user has previously tried
      - like_count        : total number of likes across all users (global popularity)

    Ordering priority:
      is_from_followed DESC → ingredient_overlap DESC → like_count DESC → date_created DESC
    """

    def build_feed(self, user: User) -> QuerySet[Recipe]:
        """
        Return an annotated, ordered queryset of recipes personalized for ``user``.

        The queryset is not evaluated here; the view applies pagination on top.
        """
        active_diet_prefs: list[str] = self._get_active_diet_prefs(user)

        # Subquery-style querysets — Django translates these to SQL subqueries,
        # not Python-evaluated lists, so they are safe to use in exclude/filter/annotate.
        blocked_creator_ids = (
            UserBlock.objects  # type: ignore[attr-defined]
            .filter(blocker=user)
            .values("blocked_id")
        )
        tried_recipe_ids = (
            TriedRecipe.objects  # type: ignore[attr-defined]
            .filter(tried_by=user)
            .values("recipe_id")
        )
        followed_ids = (
            UserFollow.objects  # type: ignore[attr-defined]
            .filter(follower=user)
            .values("followee_id")
        )
        # Distinct ingredient IDs drawn from all recipes the user has tried.
        tried_ingredient_ids = (
            RecipeIngredient.objects  # type: ignore[attr-defined]
            .filter(recipe__tried_entries__tried_by=user)
            .values("ingredient_id")
            .distinct()
        )

        qs: QuerySet[Recipe] = Recipe.objects.annotate(  # type: ignore[attr-defined]
            # How many of this recipe's ingredients have the user encountered before?
            ingredient_overlap=Count(
                "ingredients__ingredient",
                filter=Q(ingredients__ingredient_id__in=tried_ingredient_ids),
                distinct=True,
            ),
            # Boost recipes from creators the user follows.
            is_from_followed=Case(
                When(creator__in=followed_ids, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            # Global popularity signal as a tiebreaker.
            like_count=Count("recipe_likes", distinct=True),
        )

        # Exclude recipes from creators the user has blocked.
        qs = qs.exclude(creator__in=blocked_creator_ids)

        # Exclude recipes the user has already tried.
        qs = qs.exclude(id__in=tried_recipe_ids)

        # Apply dietary tag filters with AND semantics:
        # each active preference must be present in the recipe's dietary_tags array.
        for tag in active_diet_prefs:
            qs = qs.filter(dietary_tags__contains=[tag])

        # Prefetch nested relations to avoid N+1 queries during serialization.
        qs = qs.select_related("creator").prefetch_related(
            "ingredients__ingredient",
            "instructions",
        )

        return qs.order_by(
            "-is_from_followed",
            "-ingredient_overlap",
            "-like_count",
            "-date_created",
            "-id",  # stable tiebreaker — prevents duplicate rows across pages
        )

    def _get_active_diet_prefs(self, user: User) -> list[str]:
        """
        Return the list of diet keys the user has set to True.
        Safely falls back to an empty list if the profile is missing.
        """
        try:
            diet_type: dict = user.profile.diet_type or {}  # type: ignore[attr-defined]
        except AttributeError:
            return []

        return [k for k, v in diet_type.items() if v is True]
