"""
One-time management command to correct recipe ingredient data and set
appropriate serving counts for all recipes.

Fixes:
  1. Frying-oil quantities that represent the full oil bath instead of
     the absorbed amount (Fish and Chips, Chicken Tenders, Pasta and Bean Soup).
  2. Sets per-recipe serving counts so that per-serving calories land in a
     reasonable 300-700 kcal range.
  3. Recalculates RecipeNutrition for any recipe whose ingredients were modified.

Usage:
    python manage.py correct_recipe_data            # apply all corrections
    python manage.py correct_recipe_data --dry-run   # preview without DB writes
"""

from decimal import Decimal
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from nutrition.models import RecipeNutrition
from nutrition.services.calculations import compute_and_store_nutrition
from recipes.models import Recipe, RecipeIngredient


# ---------------------------------------------------------------------------
# Oil quantity corrections: {recipe_id: {ingredient_name: new_quantity_grams}}
# ---------------------------------------------------------------------------
OIL_CORRECTIONS: dict[int, dict[str, float]] = {
  # Fish and Chips: 1000g canola_oil → 150g (absorbed oil for deep-fried
  # battered fish + chips, ~10-12% absorption of 1.4kg food mass).
  84: {"canola_oil": 150.0},
  # Chicken Tenders: 480g canola_oil → 60g (absorbed oil for 200g breaded
  # chicken, ~15-20% absorption on battered/breaded items).
  72: {"canola_oil": 60.0},
  # Pasta and Bean Soup: 240g olive_oil → 30g (2 tbsp — standard for
  # sautéing aromatics in soup; 240g is nearly a full cup).
  94: {"olive_oil": 30.0},
}

# ---------------------------------------------------------------------------
# Serving counts: {recipe_id: servings}
# Only recipes that need servings > 1 are listed; all others stay at 1.
# ---------------------------------------------------------------------------
SERVINGS: dict[int, int] = {
  # Steak / large protein dishes → 2 servings
  12: 2,   # Grilled Steak (1432 kcal)
  73: 2,   # Spaghetti Carbonara (1057 kcal)
  82: 2,   # Chimichurri Steak (1435 kcal)
  87: 2,   # Creamy Spinach Gnocchi (1433 kcal)
  89: 2,   # Ribeye Steak (1410 kcal)
  90: 2,   # Cordon Bleu Chicken (1223 kcal)
  93: 2,   # Vegan Chow Mein (1224 kcal)
  100: 2,  # Wagyu with Steak Sauce (1397 kcal)

  # Casseroles / batch meals → 2 servings
  13: 2,   # Zucchini Beef Casserole (834 kcal)
  76: 2,   # Enchiladas Verdes (859 kcal)
  78: 2,   # Ratatouille (678 kcal)
  79: 2,   # Cheeseburger (1803 kcal — 2 burgers)
  95: 2,   # Borscht (655 kcal batch soup)
  98: 2,   # Venezuelan Empanadas (840 kcal)

  # Multi-serving items → 3 servings
  75: 3,   # Arepa Reina Pepiada (1491 kcal)

  # Large batch recipes → 4 servings
  72: 4,   # Chicken Tenders (after oil fix: ~1648 kcal)
  81: 4,   # Mac and Cheese (2354 kcal)
  84: 4,   # Fish and Chips (after oil fix: ~3398 kcal)
  92: 4,   # Broccoli Burgers (2222 kcal)
  94: 4,   # Pasta and Bean Soup (after oil fix: ~2157 kcal)
  102: 4,  # Meatballs (2086 kcal)

  # Large batch recipes → 6 servings
  74: 6,   # Beef Lasagna (2948 kcal)
  97: 6,   # Kanda / Peanut Stew (3090 kcal)
  101: 6,  # South African Curry and Rice (3450 kcal)
}


class Command(BaseCommand):
  help = "Correct oil quantities and set serving counts for all recipes."

  def add_arguments(self, parser: CommandParser) -> None:
    parser.add_argument(
      "--dry-run",
      action="store_true",
      help="Preview corrections without writing to the database.",
    )

  def handle(self, *_args: Any, **options: Any) -> None:
    dry_run: bool = options["dry_run"]
    if dry_run:
      self.stdout.write(self.style.WARNING("DRY RUN — no changes will be written.\n"))

    self._fix_oil_quantities(dry_run)
    self._set_servings(dry_run)
    self._report_per_serving(dry_run)

  # ---------------------------------------------------------------------------
  # Oil corrections
  # ---------------------------------------------------------------------------

  def _fix_oil_quantities(self, dry_run: bool) -> None:
    self.stdout.write("--- Oil quantity corrections ---\n")
    for recipe_id, corrections in OIL_CORRECTIONS.items():
      recipe = Recipe.objects.get(pk=recipe_id)
      for ingredient_name, new_qty in corrections.items():
        ri = RecipeIngredient.objects.get(
          recipe=recipe,
          ingredient__name=ingredient_name,
        )
        old_qty = ri.quantity
        self.stdout.write(
          f"  {recipe.name}: {ingredient_name} {old_qty}g -> {new_qty}g"
        )
        if not dry_run:
          ri.quantity = new_qty
          ri.save()

      # Recalculate nutrition after ingredient change.
      if not dry_run:
        RecipeNutrition.objects.filter(recipe=recipe).delete()
        result = compute_and_store_nutrition(recipe=recipe)
        new_cal = result.calories
        self.stdout.write(
          self.style.SUCCESS(f"    -> Recalculated: {new_cal} total kcal\n")
        )
      else:
        self.stdout.write("")

  # ---------------------------------------------------------------------------
  # Servings assignment
  # ---------------------------------------------------------------------------

  def _set_servings(self, dry_run: bool) -> None:
    self.stdout.write("--- Serving count updates ---\n")
    updated = 0
    for recipe_id, servings in SERVINGS.items():
      recipe = Recipe.objects.get(pk=recipe_id)
      if recipe.servings != servings:
        self.stdout.write(f"  {recipe.name}: {recipe.servings} -> {servings} servings")
        if not dry_run:
          recipe.servings = servings
          recipe.save(update_fields=["servings"])
        updated += 1

    remaining = Recipe.objects.exclude(pk__in=SERVINGS.keys()).filter(servings=1).count()
    self.stdout.write(f"\n  Updated: {updated} recipes")
    self.stdout.write(f"  Unchanged (1 serving): {remaining} recipes\n")

  # ---------------------------------------------------------------------------
  # Report
  # ---------------------------------------------------------------------------

  def _report_per_serving(self, dry_run: bool) -> None:
    self.stdout.write("--- Per-serving calorie report ---\n")
    label = "(projected) " if dry_run else ""
    recipes = (
      Recipe.objects
      .select_related("nutrition")
      .order_by("pk")
    )
    for r in recipes:
      try:
        total_cal = float(r.nutrition.calories)
      except RecipeNutrition.DoesNotExist:
        continue

      servings = SERVINGS.get(r.pk, r.servings) if dry_run else r.servings
      per_serving = total_cal / max(servings, 1)
      flag = " ⚠" if per_serving > 800 else ""
      self.stdout.write(
        f"  {r.name}: {total_cal:.0f} total / {servings} srv = "
        f"{label}{per_serving:.0f} kcal/srv{flag}"
      )
