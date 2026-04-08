import datetime
from decimal import Decimal
from typing import Any

from django.db.models import Sum

from meal_planning.models import MealPlanEntry
from profiles.models import UserProfile

# Sensible defaults applied when UserProfile goal fields are null.
_DEFAULT_TARGETS: dict[str, int] = {
  "calories": 2000,
  "protein": 120,
  "carbs": 250,
  "fat": 65,
}

_ZERO = Decimal("0.00")


def compute_daily_macros(user: Any, date: datetime.date) -> dict[str, Decimal]:
  """
  Aggregate macro totals from all meal plan entries for a given user and date.

  Joins through MealPlanEntry -> Recipe -> RecipeNutrition via ORM to produce
  a single SQL aggregation query. Missing nutrition data (recipe has no linked
  RecipeNutrition row) contributes zero to each total.

  Params:
    user: The authenticated user instance.
    date: The date to aggregate macros for.

  Returns:
    Dict with keys 'calories', 'protein', 'carbs', 'fat' as Decimal values.
  """
  result = (
    MealPlanEntry.objects
    .filter(user=user, date=date)
    .aggregate(
      calories=Sum("recipe__nutrition__calories"),
      protein=Sum("recipe__nutrition__protein"),
      carbs=Sum("recipe__nutrition__carbs"),
      fat=Sum("recipe__nutrition__fat"),
    )
  )
  return {
    "calories": result["calories"] or _ZERO,
    "protein": result["protein"] or _ZERO,
    "carbs": result["carbs"] or _ZERO,
    "fat": result["fat"] or _ZERO,
  }


def get_user_targets(user: Any) -> dict[str, int]:
  """
  Retrieve the user's daily macro targets from their UserProfile.

  Falls back to sensible defaults for any goal field that is null or when no
  profile exists. Targets are integers (grams for macros, kcal for calories).

  Params:
    user: The authenticated user instance.

  Returns:
    Dict with keys 'calories', 'protein', 'carbs', 'fat' as integers.
  """
  profile = (
    UserProfile.objects
    .filter(user=user)
    .values("daily_calorie_goal", "daily_protein_goal", "daily_carbs_goal", "daily_fat_goal")
    .first()
  )

  if profile is None:
    return dict(_DEFAULT_TARGETS)

  return {
    "calories": profile["daily_calorie_goal"] or _DEFAULT_TARGETS["calories"],
    "protein": profile["daily_protein_goal"] or _DEFAULT_TARGETS["protein"],
    "carbs": profile["daily_carbs_goal"] or _DEFAULT_TARGETS["carbs"],
    "fat": profile["daily_fat_goal"] or _DEFAULT_TARGETS["fat"],
  }
