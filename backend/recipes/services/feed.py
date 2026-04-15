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
from recipes.services.user_filters import get_active_allergies
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

        Pruning runs before scoring so that annotations (ingredient_overlap,
        is_from_followed, like_count) are computed only on the surviving set —
        recipes that pass all exclusion and dietary-tag filters. This avoids
        counting allergen-excluded recipes in scoring aggregates.

        The queryset is not evaluated here; the view applies pagination on top.
        """
        active_diet_prefs: list[str] = self._get_active_diet_prefs(user)
        allergy_tokens: list[str] = get_active_allergies(user)

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

        # Upstream prune — all exclusions happen before scoring so annotations
        # run on the surviving (allergy-safe, non-blocked, untried) set.
        qs: QuerySet[Recipe] = Recipe.objects.all()  # type: ignore[attr-defined]

        # Exclude recipes from creators the user has blocked.
        qs = qs.exclude(creator__in=blocked_creator_ids)

        # Exclude recipes the user has already tried.
        qs = qs.exclude(id__in=tried_recipe_ids)

        # Exclude recipes whose ingredients match any of the user's allergen tokens.
        # OR semantics: a single icontains match on any ingredient name excludes the recipe.
        #
        # We resolve allergen-matching recipe IDs into a subquery first and then
        # exclude on PK. This sidesteps the Django ORM behaviour where
        #   .exclude(Q(join_a) | Q(join_b))
        # is rewritten as NOT(join_a) AND NOT(join_b) rather than a true
        # "no row in the join satisfies the OR condition" — which causes
        # incorrect results when the M2M join produces multiple rows per recipe.
        if allergy_tokens:
            allergen_q = Q()
            for token in allergy_tokens:
                allergen_q |= Q(ingredient__name__icontains=token)
            allergen_recipe_ids = (
                RecipeIngredient.objects  # type: ignore[attr-defined]
                .filter(allergen_q)
                .values("recipe_id")
                .distinct()
            )
            qs = qs.exclude(id__in=allergen_recipe_ids)

        # Apply dietary tag filters with AND semantics:
        # each active preference must be present in the recipe's dietary_tags array.
        for tag in active_diet_prefs:
            qs = qs.filter(dietary_tags__contains=[tag])

        # Scoring annotations run on the pruned set.
        qs = qs.annotate(
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
        diet_type may be None (skipped onboarding) or {} (cleared) — both yield no active prefs.
        """
        try:
            # diet_type may be None (skipped onboarding) or {} (cleared) — both yield no active prefs
            diet_type: dict | None = user.profile.diet_type  # type: ignore[attr-defined]
            items = (diet_type or {}).items()
        except AttributeError:
            return []

        return [k for k, v in items if v is True]
