"""
Management command to rename .webp files in a directory so their filenames
match the recipe names stored in the database.

Usage:
    python manage.py rename_recipe_images --dir /path/to/images
    python manage.py rename_recipe_images --dir /path/to/images --dry-run

Matching logic:
    - Exact case-insensitive match preferred
    - Falls back to fuzzy match (ignoring punctuation/spaces differences)
    - Reports any files with no DB match and any DB recipes with no file match

Run inside Docker:
    docker-compose exec backend python manage.py rename_recipe_images --dir /path/to/images
"""

import os
from typing import Any

from django.core.management.base import BaseCommand, CommandParser

from recipes.models import Recipe
from recipes.utils.names import normalize as _normalize


class Command(BaseCommand):
    help = "Rename .webp recipe image files to match recipe names in the DB."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--dir",
            type=str,
            required=True,
            help="Directory containing the .webp files.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print planned renames without making any changes.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        image_dir = os.path.expanduser(options["dir"])
        dry_run: bool = options["dry_run"]

        if not os.path.isdir(image_dir):
            self.stderr.write(self.style.ERROR(f"Directory not found: {image_dir}"))
            return

        # --- Collect .webp files (ignore Zone.Identifier metadata files) ---
        webp_files = [
            f for f in os.listdir(image_dir)
            if f.lower().endswith(".webp") and "Zone.Identifier" not in f
        ]
        if not webp_files:
            self.stderr.write(self.style.WARNING("No .webp files found."))
            return

        # --- Fetch all recipe names from the DB ---
        db_names: list[str] = list(
            Recipe.objects.values_list("name", flat=True).order_by("name")
        )
        if not db_names:
            self.stderr.write(self.style.ERROR("No recipes found in the database."))
            return

        # Build lookup maps
        exact_map: dict[str, str] = {n.lower(): n for n in db_names}
        fuzzy_map: dict[str, str] = {_normalize(n): n for n in db_names}

        renamed = 0
        already_correct = 0
        unmatched_files: list[str] = []

        for filename in sorted(webp_files):
            stem = os.path.splitext(filename)[0]  # name without .webp
            db_name: str | None = None

            # 1. Exact case-insensitive
            if stem.lower() in exact_map:
                db_name = exact_map[stem.lower()]
            # 2. Fuzzy (punctuation/space-insensitive)
            elif _normalize(stem) in fuzzy_map:
                db_name = fuzzy_map[_normalize(stem)]

            if db_name is None:
                unmatched_files.append(filename)
                continue

            new_filename = f"{db_name}.webp"
            if filename == new_filename:
                already_correct += 1
                continue

            src = os.path.join(image_dir, filename)
            dst = os.path.join(image_dir, new_filename)

            if dry_run:
                self.stdout.write(
                    f"  {self.style.WARNING('DRY RUN')}  "
                    f"{filename!r}  ->  {new_filename!r}"
                )
            else:
                os.rename(src, dst)
                self.stdout.write(
                    self.style.SUCCESS(f"  Renamed: {filename!r}  ->  {new_filename!r}")
                )
            renamed += 1

        # --- Summary ---
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"{'Would rename' if dry_run else 'Renamed'}: {renamed} file(s)"
        ))
        self.stdout.write(f"Already correct: {already_correct} file(s)")

        if unmatched_files:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING(
                f"No DB match found for {len(unmatched_files)} file(s):"
            ))
            for f in unmatched_files:
                self.stdout.write(f"    {f}")

        # --- DB recipes with no corresponding file ---
        file_normalized = {_normalize(os.path.splitext(f)[0]) for f in webp_files}
        missing_images = [n for n in db_names if _normalize(n) not in file_normalized]
        if missing_images:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING(
                f"{len(missing_images)} DB recipe(s) have no matching image file:"
            ))
            for n in missing_images:
                self.stdout.write(f"    {n}")
