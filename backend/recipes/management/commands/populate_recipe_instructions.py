"""
Management command to populate RecipeInstruction records from a CSV file.

Usage:
    python manage.py populate_recipe_instructions ~/Docs/generated_recipe_instructions.csv
    python manage.py populate_recipe_instructions ~/Docs/generated_recipe_instructions.csv --dry-run

Never creates new Recipe rows. CSV rows whose name has no DB match are skipped
and reported. Existing instructions for a recipe are deleted and replaced
atomically inside the same transaction. Safe to re-run (idempotent outcome).
"""

import csv
import difflib
import re
from typing import Any

from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction

from recipes.models import Recipe, RecipeInstruction


STEP_RE = re.compile(r"^\s*(\d+)\.\s+(.+?)\s*$", re.MULTILINE)
REQUIRED_COLUMNS = {"Recipe Name", "Instructions"}


def _parse_steps(
    recipe_name: str, raw: str
) -> tuple[list[tuple[int, str]], str | None]:
    """
    Parse a numbered-step instructions string into a list of (step_number, text).

    Returns (steps, error_message).  On success error_message is None.
    """
    matches = STEP_RE.findall(raw)
    if not matches:
        return [], f"No parseable steps found for '{recipe_name}'"

    nums = [int(n) for n, _ in matches]
    expected = list(range(1, len(nums) + 1))
    if nums != expected:
        return [], (
            f"Non-sequential step numbers in '{recipe_name}': "
            f"got {nums}, expected {expected}"
        )

    return [(int(n), t.strip()) for n, t in matches], None


def _suggest(name: str, candidates: list[str]) -> str:
    """Return a fuzzy-match hint, or an empty string if nothing is close."""
    matches = difflib.get_close_matches(name, candidates, n=1, cutoff=0.75)
    return f" (did you mean: '{matches[0]}'?)" if matches else ""


class Command(BaseCommand):
    help = "Populate RecipeInstruction rows from a CSV of numbered steps."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "csv_path",
            type=str,
            help="Path to the recipe instructions CSV file.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate and report without writing to the database.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path: str = options["csv_path"]
        dry_run: bool = options["dry_run"]

        # ── 1. Load CSV ──────────────────────────────────────────────────────
        try:
            with open(csv_path, newline="", encoding="utf-8") as fh:
                rows = list(csv.DictReader(fh))
        except OSError as exc:
            raise CommandError(f"Cannot open CSV: {exc}") from exc

        if not rows:
            raise CommandError("CSV file is empty.")

        missing_cols = REQUIRED_COLUMNS - set(rows[0].keys())
        if missing_cols:
            raise CommandError(
                f"CSV is missing required columns: {sorted(missing_cols)}"
            )

        # ── 2. Load all DB recipes ───────────────────────────────────────────
        recipes_by_name: dict[str, Recipe] = {
            r.name: r for r in Recipe.objects.all()
        }

        # ── 3. Pre-validation pass ───────────────────────────────────────────
        csv_names: list[str] = [row["Recipe Name"].strip() for row in rows]
        db_names: list[str] = list(recipes_by_name.keys())

        # Fatal parse errors collected before we touch the DB.
        parse_errors: list[str] = []
        parsed: dict[str, list[tuple[int, str]]] = {}  # name → steps

        for row in rows:
            name = row["Recipe Name"].strip()
            if name not in recipes_by_name:
                # Will be reported later — no point parsing.
                continue
            steps, err = _parse_steps(name, row["Instructions"])
            if err:
                parse_errors.append(err)
            else:
                parsed[name] = steps

        if parse_errors:
            for err in parse_errors:
                self.stderr.write(self.style.ERROR(f"  PARSE ERROR: {err}"))
            raise CommandError(
                f"Aborting — {len(parse_errors)} parse error(s) must be fixed "
                "before the migration can run."
            )

        # Coverage reports (non-fatal — gathered now, printed at end).
        csv_not_in_db: list[str] = [
            n for n in csv_names if n not in recipes_by_name
        ]
        db_not_in_csv: list[str] = [
            n for n in db_names if n not in set(csv_names)
        ]

        # ── 4. Migration inside a single atomic transaction ──────────────────
        instructions_created = 0
        recipes_inserted = 0
        recipes_replaced = 0

        with transaction.atomic():
            for name, steps in parsed.items():
                recipe = recipes_by_name[name]

                if recipe.instructions.exists():
                    RecipeInstruction.objects.filter(recipe=recipe).delete()
                    recipes_replaced += 1
                else:
                    recipes_inserted += 1

                RecipeInstruction.objects.bulk_create([
                    RecipeInstruction(
                        recipe=recipe,
                        step_number=step_number,
                        text=text,
                        # estimated_cooktime intentionally left NULL
                    )
                    for step_number, text in steps
                ])
                instructions_created += len(steps)

            if dry_run:
                self.stdout.write(self.style.WARNING("\n[DRY RUN] Rolling back.\n"))
                transaction.set_rollback(True)

        # ── 5. Summary ───────────────────────────────────────────────────────
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("SUMMARY"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"  Recipes with instructions inserted:  {recipes_inserted}")
        self.stdout.write(f"  Recipes with instructions replaced:  {recipes_replaced}")
        self.stdout.write(f"  Total RecipeInstruction rows:        {instructions_created}")

        if csv_not_in_db:
            self.stdout.write(
                self.style.WARNING(
                    f"\n  CSV rows skipped (recipe not in DB): {len(csv_not_in_db)}"
                )
            )
            for name in csv_not_in_db:
                hint = _suggest(name, db_names)
                self.stdout.write(self.style.WARNING(f"    - '{name}'{hint}"))

        if db_not_in_csv:
            self.stdout.write(
                self.style.WARNING(
                    f"\n  DB recipes without a CSV match: {len(db_not_in_csv)}"
                )
            )
            for name in db_not_in_csv:
                hint = _suggest(name, csv_names)
                self.stdout.write(self.style.WARNING(f"    - '{name}'{hint}"))

        if not csv_not_in_db and not db_not_in_csv:
            self.stdout.write(self.style.SUCCESS("\n  Full coverage — no mismatches!"))
