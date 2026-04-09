"""
One-time management command to set servings=1 for all existing recipes
and flag recipes with suspiciously high per-serving calorie counts.

Usage:
    python manage.py set_default_servings           # run the update
    python manage.py set_default_servings --dry-run # preview without writing

The command is idempotent — running it again is a safe no-op since all
recipes will already have servings=1.
"""

from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db.models import F, QuerySet

from nutrition.models import RecipeNutrition
from recipes.models import Recipe

_HIGH_CALORIE_THRESHOLD = 1500


class Command(BaseCommand):
  help = (
    "Set servings=1 for all existing recipes (safe default) and report "
    "recipes with per-serving calories above the suspicion threshold."
  )

  def add_arguments(self, parser: CommandParser) -> None:
    parser.add_argument(
      "--dry-run",
      action="store_true",
      help="Report what would change without writing to the database.",
    )

  def handle(self, *args: Any, **options: Any) -> None:
    dry_run: bool = options["dry_run"]

    recipes_to_update: QuerySet[Recipe] = Recipe.objects.filter(servings__isnull=True) | Recipe.objects.filter(servings=0)
    update_count: int = recipes_to_update.count()

    if dry_run:
      self.stdout.write(self.style.WARNING("DRY RUN - no changes will be written.\n"))
    else:
      # Set servings=1 for any recipes with null or 0 servings
      updated: int = recipes_to_update.update(servings=1)
      self.stdout.write(f"Updated {updated} recipe(s) to servings=1.\n")

    # Report high-calorie recipes for manual review
    high_cal_recipes = (
      RecipeNutrition.objects
      .select_related("recipe")
      .annotate(per_serving_cal=F("calories") / F("recipe__servings"))
      .filter(per_serving_cal__gt=_HIGH_CALORIE_THRESHOLD)
      .order_by("-per_serving_cal")
    )

    if high_cal_recipes.exists():
      self.stdout.write(
        self.style.WARNING(
          f"\nRecipes with per-serving calories > {_HIGH_CALORIE_THRESHOLD} kcal "
          f"(likely need servings adjusted):\n"
        )
      )
      for n in high_cal_recipes:
        self.stdout.write(
          f"  Recipe #{n.recipe.pk} \"{n.recipe.name}\": "
          f"{n.calories} total kcal / {n.recipe.servings} serving(s) "
          f"= {n.per_serving_cal:.0f} kcal/serving"
        )
    else:
      self.stdout.write(self.style.SUCCESS("\nNo recipes exceed the per-serving calorie threshold."))
