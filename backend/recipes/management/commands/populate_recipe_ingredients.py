"""
Management command to populate RecipeIngredient records from a CSV file,
update Recipe dietary_tags, and compute nutrition for each recipe.

Usage:
    python manage.py populate_recipe_ingredients ~/Downloads/recipes-list.csv
    python manage.py populate_recipe_ingredients ~/Downloads/recipes-list.csv --dry-run

The command is idempotent — recipes that already have ingredients are skipped.
"""

import csv
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from ingredients.models import Ingredient
from nutrition.services.calculations import compute_and_store_nutrition
from recipes.models import Recipe, RecipeIngredient


class Command(BaseCommand):
  help = "Populate RecipeIngredient records from a CSV and compute nutrition."

  def add_arguments(self, parser: CommandParser) -> None:
    parser.add_argument(
      "csv_path",
      type=str,
      help="Path to the recipes CSV file.",
    )
    parser.add_argument(
      "--dry-run",
      action="store_true",
      help="Validate without writing to the database.",
    )

  def handle(self, *args: Any, **options: Any) -> None:
    csv_path: str = options["csv_path"]
    dry_run: bool = options["dry_run"]

    ingredients_by_name: dict[str, Ingredient] = {
      i.name: i for i in Ingredient.objects.all()
    }
    recipes_by_name: dict[str, Recipe] = {
      r.name: r for r in Recipe.objects.all()
    }

    with open(csv_path, "r") as f:
      rows = list(csv.DictReader(f))

    errors: list[str] = []
    skipped_recipes: list[str] = []
    tags_updated = 0
    ingredients_created = 0
    nutrition_computed = 0

    with transaction.atomic():
      for row in rows:
        recipe_name = row["Recipe Name"].strip()
        recipe = recipes_by_name.get(recipe_name)
        if recipe is None:
          errors.append(f"Recipe not found in DB: '{recipe_name}'")
          continue

        # --- Update dietary_tags if they differ ---
        csv_tags = [t.strip() for t in row["Diet Type"].split(";")]
        if recipe.dietary_tags != csv_tags:
          if not dry_run:
            Recipe.objects.filter(pk=recipe.pk).update(dietary_tags=csv_tags)
          tags_updated += 1
          self.stdout.write(f"  Tags updated: {recipe_name} → {csv_tags}")

        # --- Skip recipes that already have ingredients ---
        if recipe.ingredients.exists():
          skipped_recipes.append(recipe_name)
          continue

        # --- Parse ingredient entries and create RecipeIngredient ---
        parts = row["Ingredients (amounts in g)"].split(";")
        for part in parts:
          part = part.strip()
          if not part or " - " not in part:
            if part:
              errors.append(
                f"Malformed ingredient entry in '{recipe_name}': '{part}'"
              )
            continue

          name, amount_str = part.split(" - ", 1)
          name = name.strip()
          amount_str = amount_str.strip()

          ingredient = ingredients_by_name.get(name)
          if ingredient is None:
            errors.append(
              f"Ingredient not found in DB: '{name}' (recipe: '{recipe_name}')"
            )
            continue

          num_str = amount_str.rstrip("g").strip()
          try:
            quantity = float(num_str)
          except ValueError:
            errors.append(
              f"Invalid quantity '{amount_str}' for '{name}' in '{recipe_name}'"
            )
            continue

          if not dry_run:
            RecipeIngredient.objects.create(
              recipe=recipe,
              ingredient=ingredient,
              quantity=quantity,
              unit="g",
            )
          ingredients_created += 1

        # --- Compute and store nutrition ---
        if not dry_run:
          result = compute_and_store_nutrition(recipe=recipe)
          if result.ok:
            nutrition_computed += 1
          else:
            errors.append(
              f"Nutrition failed for '{recipe_name}': {result.reason}"
            )

      if dry_run:
        self.stdout.write(self.style.WARNING("\n[DRY RUN] Rolling back.\n"))
        transaction.set_rollback(True)

    # --- Summary ---
    self.stdout.write("\n" + "=" * 60)
    self.stdout.write(self.style.SUCCESS("SUMMARY"))
    self.stdout.write("=" * 60)
    self.stdout.write(f"  Dietary tags updated:      {tags_updated}")
    self.stdout.write(f"  RecipeIngredient created:  {ingredients_created}")
    self.stdout.write(f"  Nutrition records created: {nutrition_computed}")

    if skipped_recipes:
      self.stdout.write(
        f"  Skipped (already populated): {len(skipped_recipes)}"
      )

    if errors:
      self.stdout.write(self.style.ERROR(f"\n  Errors ({len(errors)}):"))
      for e in errors:
        self.stdout.write(self.style.ERROR(f"    {e}"))
    else:
      self.stdout.write(self.style.SUCCESS("\n  No errors!"))
