"""
Management command to verify Ingredient table accuracy against a reference CSV.

Usage:
    python manage.py verify_ingredient_data ~/Downloads/ingredients.csv
    python manage.py verify_ingredient_data ~/Downloads/ingredients.csv --fix
    python manage.py verify_ingredient_data ~/Downloads/ingredients.csv --fix --remove-extras

The command compares every DB row against the CSV using name-normalized matching
(case-insensitive, underscore/space stripped) to bridge the PascalCase → snake_case gap.

Without --fix: report only (read-only, safe to run at any time).
With    --fix: applies inserts and updates inside a single atomic transaction.
With    --fix --remove-extras: also deletes DB rows absent from the CSV.
"""

import csv
import os
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from ingredients.models import Ingredient

# Nutritional fields present in the CSV (excludes default_unit, which is DB-only).
NUTRITION_FIELDS: tuple[str, ...] = (
    "calories_per_100g",
    "protein_per_100g",
    "carbs_per_100g",
    "fat_per_100g",
    "fiber_per_100g",
    "sugar_per_100g",
    "sodium_per_100g",
)


def _normalize(name: str) -> str:
    """Return a case-insensitive, punctuation-stripped key for fuzzy name matching.

    Examples:
        "GroundBeef"  -> "groundbeef"
        "ground_beef" -> "groundbeef"
        "Peanut Butter" -> "peanutbutter"
    """
    return name.lower().replace("_", "").replace(" ", "")


def _parse_decimal(value: str, field: str, row_name: str) -> Decimal:
    """Parse a CSV string value into Decimal, raising CommandError on failure."""
    try:
        return Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError(
            f"Invalid numeric value '{value}' for field '{field}' on row '{row_name}'"
        ) from exc


def _load_csv(path: Path) -> dict[str, dict[str, Any]]:
    """Parse the reference CSV into a dict keyed by ingredient_name.

    Returns:
        { ingredient_name: { field: Decimal, ... } }
    """
    rows: dict[str, dict[str, Any]] = {}

    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)

        for row in reader:
            name: str = row["ingredient_name"].strip()
            if not name:
                continue

            nutrition: dict[str, Decimal] = {}
            for field in NUTRITION_FIELDS:
                nutrition[field] = _parse_decimal(row[field].strip(), field, name)

            rows[name] = nutrition

    return rows


class Command(BaseCommand):
    help = (
        "Verify the Ingredient table against a reference CSV. "
        "Produces a diff report and optionally applies corrections (--fix)."
    )

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "csv_path",
            nargs="?",
            default=str(Path.home() / "Downloads" / "ingredients.csv"),
            help="Path to the reference CSV file (default: ~/Downloads/ingredients.csv)",
        )
        parser.add_argument(
            "--fix",
            action="store_true",
            default=False,
            help="Apply corrections to the database (inserts + updates).",
        )
        parser.add_argument(
            "--remove-extras",
            action="store_true",
            default=False,
            help="Also delete DB rows not present in the CSV (requires --fix).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path = Path(os.path.expanduser(options["csv_path"]))
        apply_fix: bool = options["fix"]
        remove_extras: bool = options["remove_extras"]

        if remove_extras and not apply_fix:
            self.stderr.write(
                self.style.ERROR("--remove-extras requires --fix to be set.")
            )
            return

        if not csv_path.exists():
            self.stderr.write(self.style.ERROR(f"CSV not found: {csv_path}"))
            return

        # ------------------------------------------------------------------ #
        # Load reference data                                                  #
        # ------------------------------------------------------------------ #
        self.stdout.write(f"Loading CSV: {csv_path}")
        csv_rows = _load_csv(csv_path)
        self.stdout.write(f"  {len(csv_rows)} ingredients in CSV\n")

        # Build a normalized-key lookup for the CSV.
        csv_by_key: dict[str, str] = {_normalize(n): n for n in csv_rows}

        # ------------------------------------------------------------------ #
        # Load DB data                                                         #
        # ------------------------------------------------------------------ #
        db_qs = Ingredient.objects.all()
        db_count = db_qs.count()
        self.stdout.write(f"Loading DB ... {db_count} ingredients found\n")

        # Build a normalized-key lookup for the DB.
        db_by_key: dict[str, Ingredient] = {
            _normalize(obj.name): obj for obj in db_qs
        }

        # ------------------------------------------------------------------ #
        # Compute diff                                                         #
        # ------------------------------------------------------------------ #
        missing: list[str] = []          # CSV names with no DB match
        extras: list[Ingredient] = []    # DB objects with no CSV match
        to_update: list[tuple[Ingredient, dict[str, Any]]] = []  # (obj, changed_fields)

        # Check every CSV entry against DB.
        for csv_key, csv_name in csv_by_key.items():
            csv_nutrition = csv_rows[csv_name]

            if csv_key not in db_by_key:
                missing.append(csv_name)
                continue

            db_obj = db_by_key[csv_key]
            changed: dict[str, Any] = {}

            # Name format mismatch.
            if db_obj.name != csv_name:
                changed["name"] = csv_name

            # Nutritional value mismatches.
            for field in NUTRITION_FIELDS:
                db_val: Decimal = getattr(db_obj, field)
                csv_val: Decimal = csv_nutrition[field]
                if db_val.normalize() != csv_val.normalize():
                    changed[field] = csv_val

            if changed:
                to_update.append((db_obj, changed))

        # Check every DB entry against CSV.
        for db_key, db_obj in db_by_key.items():
            if db_key not in csv_by_key:
                extras.append(db_obj)

        # ------------------------------------------------------------------ #
        # Print report                                                         #
        # ------------------------------------------------------------------ #
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("DIFF REPORT"))
        self.stdout.write("=" * 60)

        # --- Missing ----------------------------------------------------- #
        self.stdout.write(
            self.style.WARNING(f"\n[MISSING — {len(missing)} to INSERT]")
        )
        for name in sorted(missing):
            self.stdout.write(f"  + {name}")

        # --- Updates ----------------------------------------------------- #
        self.stdout.write(
            self.style.WARNING(f"\n[MISMATCHED — {len(to_update)} to UPDATE]")
        )
        for db_obj, changed in sorted(to_update, key=lambda t: t[0].name):
            self.stdout.write(f"  ~ {db_obj.name}")
            for field, new_val in changed.items():
                old_val = getattr(db_obj, field) if field != "name" else db_obj.name
                self.stdout.write(f"      {field}: {old_val!r} → {new_val!r}")

        # --- Extras ------------------------------------------------------ #
        action_label = "to DELETE" if remove_extras else "not in CSV (use --remove-extras to delete)"
        self.stdout.write(
            self.style.WARNING(f"\n[EXTRAS — {len(extras)} {action_label}]")
        )
        for db_obj in sorted(extras, key=lambda o: o.name):
            self.stdout.write(f"  - {db_obj.name} (pk={db_obj.pk})")

        # --- Summary ----------------------------------------------------- #
        self.stdout.write("\n" + "-" * 60)
        self.stdout.write(
            f"Summary: {len(missing)} missing | {len(to_update)} mismatched | {len(extras)} extras"
        )
        self.stdout.write("-" * 60 + "\n")

        if not apply_fix:
            self.stdout.write(
                self.style.WARNING("Run with --fix to apply corrections.")
            )
            return

        # ------------------------------------------------------------------ #
        # Apply fixes                                                          #
        # ------------------------------------------------------------------ #
        self.stdout.write(self.style.SUCCESS("\nApplying fixes (atomic transaction) ..."))

        with transaction.atomic():
            # Inserts.
            inserted = 0
            for csv_name in missing:
                nutrition = csv_rows[csv_name]
                Ingredient(name=csv_name, **nutrition).save()
                inserted += 1

            # Updates — QuerySet.update() bypasses the model's save() guard.
            updated = 0
            for db_obj, changed in to_update:
                Ingredient.objects.filter(pk=db_obj.pk).update(**changed)
                updated += 1

            # Deletes — QuerySet.delete() uses SQL Collector, bypasses model's delete().
            deleted = 0
            if remove_extras and extras:
                extra_pks = [obj.pk for obj in extras]
                Ingredient.objects.filter(pk__in=extra_pks).delete()
                deleted = len(extra_pks)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {inserted} inserted, {updated} updated, {deleted} deleted."
            )
        )
