"""
Management command to load recipe descriptions from a CSV into the database.

Reads the CSV (columns: Index, Recipe Name, Description, Word Count),
matches each row to a Recipe by name (case-insensitive), and updates
Recipe.description.  Never creates new Recipe rows.  Safe to re-run
(idempotent — overwrites existing description with the CSV value each time).

Usage:
    python manage.py load_recipe_descriptions
    python manage.py load_recipe_descriptions \\
        --csv ~/Docs/recipe_descriptions.csv \\
        --dry-run
"""

import csv
import difflib
import os
from typing import Any

from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction

from recipes.models import Recipe


_DEFAULT_CSV = os.path.expanduser("~/Docs/recipe_descriptions.csv")
_MAX_DESCRIPTION_LENGTH = 500


def _suggest(name: str, candidates: list[str]) -> str:
    matches = difflib.get_close_matches(name, candidates, n=1, cutoff=0.75)
    return f" (did you mean: '{matches[0]}'?)" if matches else ""


class Command(BaseCommand):
    help = "Update Recipe.description from a CSV of recipe descriptions."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--csv",
            dest="csv_path",
            default=_DEFAULT_CSV,
            type=str,
            help="Path to the CSV file (must have 'Recipe Name' and 'Description' columns).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate and report without writing to the database.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path: str = os.path.expanduser(options["csv_path"])
        dry_run: bool = options["dry_run"]

        # ── 1. Load CSV ──────────────────────────────────────────────────────
        try:
            with open(csv_path, newline="", encoding="utf-8") as fh:
                rows = list(csv.DictReader(fh))
        except OSError as exc:
            raise CommandError(f"Cannot open CSV: {exc}") from exc

        if not rows:
            raise CommandError("CSV file is empty.")

        required = {"Recipe Name", "Description"}
        missing_cols = required - set(rows[0].keys())
        if missing_cols:
            raise CommandError(
                f"CSV is missing required columns: {sorted(missing_cols)}"
            )

        # ── 2. Pre-validation: check description lengths ─────────────────────
        length_errors: list[str] = []
        for row in rows:
            desc = row["Description"]
            if len(desc) > _MAX_DESCRIPTION_LENGTH:
                length_errors.append(
                    f"  '{row['Recipe Name']}': {len(desc)} chars (max {_MAX_DESCRIPTION_LENGTH})"
                )
        if length_errors:
            for err in length_errors:
                self.stderr.write(self.style.ERROR(err))
            raise CommandError(
                f"Aborting — {len(length_errors)} description(s) exceed "
                f"max_length={_MAX_DESCRIPTION_LENGTH}. Fix before loading."
            )

        # ── 3. Load all DB recipes ───────────────────────────────────────────
        db_by_lower: dict[str, Recipe] = {
            r.name.lower(): r for r in Recipe.objects.all()
        }
        db_names: list[str] = [r.name for r in db_by_lower.values()]

        # ── 4. Match CSV rows → recipes ──────────────────────────────────────
        to_update: list[tuple[Recipe, str]] = []  # (recipe, new_description)
        unmatched: list[str] = []

        for row in rows:
            name = row["Recipe Name"].strip()
            recipe = db_by_lower.get(name.lower())
            if recipe is None:
                unmatched.append(name)
                continue
            to_update.append((recipe, row["Description"]))

        # ── 5. Apply updates ─────────────────────────────────────────────────
        with transaction.atomic():
            for recipe, description in to_update:
                recipe.description = description
                recipe.save(update_fields=["description"])

            if dry_run:
                self.stdout.write(self.style.WARNING("\n[DRY RUN] Rolling back.\n"))
                transaction.set_rollback(True)

        # ── 6. Summary ───────────────────────────────────────────────────────
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("SUMMARY"))
        self.stdout.write("=" * 60)
        action = "Would update" if dry_run else "Updated"
        self.stdout.write(f"  {action}: {len(to_update)} recipe(s)")
        self.stdout.write(f"  Skipped (no DB match): {len(unmatched)}")

        if unmatched:
            self.stdout.write(
                self.style.WARNING(f"\n  CSV names with no DB match ({len(unmatched)}):")
            )
            for name in unmatched:
                hint = _suggest(name, db_names)
                self.stdout.write(self.style.WARNING(f"    - '{name}'{hint}"))
        else:
            self.stdout.write(self.style.SUCCESS("\n  Full coverage — no mismatches!"))
