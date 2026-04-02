"""
One-time management command to backfill RecipeNutrition rows for all recipes
that predate the on-creation calculation introduced in the nutrition refactor.

Usage:
    python manage.py backfill_recipe_nutrition           # run the backfill
    python manage.py backfill_recipe_nutrition --dry-run # simulate, no DB writes

The command is idempotent — recipes that already have a RecipeNutrition record
are excluded from the query, so re-running is a safe no-op.
"""

import sys
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from nutrition.services.calculations import NutritionResult, compute_and_store_nutrition
from recipes.models import Recipe


class Command(BaseCommand):
  help = (
    "Backfill RecipeNutrition rows for recipes created before on-creation "
    "nutrition calculation was introduced. Safe to re-run (idempotent)."
  )

  def add_arguments(self, parser: CommandParser) -> None:
    parser.add_argument(
      "--dry-run",
      action="store_true",
      help=(
        "List the recipes that would be backfilled without writing "
        "anything to the database."
      ),
    )

  def handle(self, *args: Any, **options: Any) -> None:
    dry_run: bool = options["dry_run"]

    recipes_qs = Recipe.objects.filter(nutrition__isnull=True)
    total: int = recipes_qs.count()

    if total == 0:
      self.stdout.write(
        self.style.SUCCESS("Nothing to backfill — all recipes already have nutrition data.")
      )
      return

    if dry_run:
      self._handle_dry_run(recipes_qs, total)
      return

    self._handle_live_run(recipes_qs, total)

  # ---------------------------------------------------------------------------
  # Private helpers
  # ---------------------------------------------------------------------------

  def _handle_dry_run(self, recipes_qs: Any, total: int) -> None:
    """
    Print the recipes that would be processed without touching the database.
    No transaction is opened — this is a pure read path.
    """
    self.stdout.write(self.style.WARNING("DRY RUN — no changes will be written.\n"))
    self.stdout.write(f"Found {total} recipe(s) without nutrition data:\n")

    for recipe in recipes_qs.only("pk", "name").iterator():
      self.stdout.write(f"  [would process] Recipe #{recipe.pk} \"{recipe.name}\"")

    self.stdout.write(
      self.style.SUCCESS(
        f"\n(DRY RUN) Would attempt to backfill {total} recipe(s). "
        "Run without --dry-run to apply."
      )
    )

  def _handle_live_run(self, recipes_qs: Any, total: int) -> None:
    """
    Compute and persist RecipeNutrition for each recipe.
    Each recipe runs inside its own savepoint so a single failure does not
    abort the remaining work.
    """
    self.stdout.write(f"Found {total} recipe(s) without nutrition data. Processing...\n")

    success_count: int = 0
    skipped_count: int = 0
    error_log: list[str] = []

    with transaction.atomic():
      for recipe in recipes_qs.iterator():
        result, error_msg = self._process_recipe(recipe)

        if result is not None and result.ok:
          success_count += 1
          self.stdout.write(f"  [ok]   Recipe #{recipe.pk} \"{recipe.name}\"")
        elif result is not None and not result.ok:
          # compute_and_store_nutrition returned ok=False (no ingredients)
          skipped_count += 1
          self.stdout.write(
            self.style.WARNING(
              f"  [skip] Recipe #{recipe.pk} \"{recipe.name}\" — no ingredients"
            )
          )
        else:
          # ValueError raised by convert_to_grams (unsupported unit)
          entry = f"Recipe #{recipe.pk} \"{recipe.name}\": {error_msg}"
          error_log.append(entry)
          self.stdout.write(self.style.ERROR(f"  [err]  {entry}"))

    self.stdout.write(
      f"\nBackfill complete."
      f"\n  Recipes processed   : {total}"
      f"\n  Successful          : {success_count}"
      f"\n  Skipped (no ingr.)  : {skipped_count}"
      f"\n  Errors              : {len(error_log)}"
    )

    if error_log:
      self.stdout.write("\nRecipes with errors:")
      for entry in error_log:
        self.stdout.write(self.style.ERROR(f"    - {entry}"))
      sys.exit(1)
    else:
      self.stdout.write(self.style.SUCCESS("\nAll processed recipes completed without errors."))

  def _process_recipe(
    self, recipe: Recipe
  ) -> tuple[NutritionResult | None, str | None]:
    """
    Attempt to compute and store nutrition for a single recipe inside a
    savepoint so that a failure does not abort the outer transaction.

    The inner transaction.atomic() creates a PostgreSQL savepoint.
    If convert_to_grams() raises ValueError, Django rolls back only that
    savepoint; the outer transaction remains healthy.

    Returns:
        (NutritionResult, None)  on success or no-ingredients skip.
        (None, error_message)    on ValueError from an unsupported unit.
    """
    try:
      with transaction.atomic():
        result = compute_and_store_nutrition(recipe=recipe)
      return result, None
    except ValueError as exc:
      return None, str(exc)
