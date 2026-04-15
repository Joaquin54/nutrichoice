"""
Management command to dump ingredient lists for recipes named in a CSV.

Reads recipe names from the CSV, looks each one up case-insensitively in the
database, and writes a JSON file mapping each matched recipe name to its list
of ingredient names.  Produces no DB writes — safe to run in any environment.

Usage:
    python manage.py dump_recipe_ingredients
    python manage.py dump_recipe_ingredients \\
        --csv ~/Docs/recipe_descriptions.csv \\
        --out ~/Docs/recipe_ingredients_dump.json
"""

import csv
import difflib
import json
import os
from typing import Any

from django.core.management.base import BaseCommand, CommandError, CommandParser

from recipes.models import Recipe


_DEFAULT_CSV = os.path.expanduser("~/Docs/recipe_descriptions.csv")
_DEFAULT_OUT = os.path.expanduser("~/Docs/recipe_ingredients_dump.json")


def _suggest(name: str, candidates: list[str]) -> str:
    """Return a fuzzy-match hint, or an empty string if nothing is close."""
    matches = difflib.get_close_matches(name, candidates, n=1, cutoff=0.75)
    return f" (did you mean: '{matches[0]}'?)" if matches else ""


class Command(BaseCommand):
    help = "Dump DB ingredient lists for recipes listed in a CSV to a JSON file."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--csv",
            dest="csv_path",
            default=_DEFAULT_CSV,
            type=str,
            help="Path to the recipe CSV (must have a 'Recipe Name' column).",
        )
        parser.add_argument(
            "--out",
            dest="out_path",
            default=_DEFAULT_OUT,
            type=str,
            help="Output path for the JSON dump.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path: str = os.path.expanduser(options["csv_path"])
        out_path: str = os.path.expanduser(options["out_path"])

        # ── 1. Load CSV names ────────────────────────────────────────────────
        try:
            with open(csv_path, newline="", encoding="utf-8") as fh:
                rows = list(csv.DictReader(fh))
        except OSError as exc:
            raise CommandError(f"Cannot open CSV: {exc}") from exc

        if not rows:
            raise CommandError("CSV file is empty.")

        if "Recipe Name" not in rows[0]:
            raise CommandError("CSV is missing required column: 'Recipe Name'")

        csv_names: list[str] = [row["Recipe Name"].strip() for row in rows]

        # ── 2. Load all DB recipes with their ingredients prefetched ─────────
        db_recipes = (
            Recipe.objects.prefetch_related("ingredients__ingredient").all()
        )
        # Build case-folded lookup: lower(name) → Recipe instance
        db_by_lower: dict[str, Recipe] = {r.name.lower(): r for r in db_recipes}
        db_names: list[str] = [r.name for r in db_recipes]

        # ── 3. Match CSV names → ingredient lists ────────────────────────────
        matched: dict[str, list[str]] = {}
        unmatched: list[str] = []

        for name in csv_names:
            recipe = db_by_lower.get(name.lower())
            if recipe is None:
                unmatched.append(name)
                continue
            ingredient_names: list[str] = [
                ri.ingredient.name for ri in recipe.ingredients.all()
            ]
            matched[name] = ingredient_names

        # ── 4. Write JSON ────────────────────────────────────────────────────
        out_dir = os.path.dirname(out_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        payload = {"matched": matched, "unmatched": unmatched}
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, ensure_ascii=False)

        # ── 5. Summary ───────────────────────────────────────────────────────
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("SUMMARY"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"  CSV recipes:        {len(csv_names)}")
        self.stdout.write(f"  Matched in DB:      {len(matched)}")
        self.stdout.write(f"  Not found in DB:    {len(unmatched)}")
        self.stdout.write(f"  Output written to:  {out_path}")

        if unmatched:
            self.stdout.write(
                self.style.WARNING(
                    f"\n  CSV names with no DB match ({len(unmatched)}):"
                )
            )
            for name in unmatched:
                hint = _suggest(name, db_names)
                self.stdout.write(self.style.WARNING(f"    - '{name}'{hint}"))
        else:
            self.stdout.write(self.style.SUCCESS("\n  Full coverage — no mismatches!"))
