"""
Management command to upload curated recipe .webp images to Supabase Storage
and persist the resulting public URL onto each Recipe's ``image_1`` field.

Usage:
    python manage.py upload_recipe_images --dir /path/to/recipe_images
    python manage.py upload_recipe_images --dir /path/to/recipe_images --dry-run
    python manage.py upload_recipe_images --dir /path/to/recipe_images --allow-partial

Matching logic (same fuzzy rules as rename_recipe_images):
    - Exact case-insensitive match preferred
    - Falls back to fuzzy match (ignoring punctuation/spaces differences)

Storage path format: ``{nutrichoice_user_id}/{recipe_id}/0.webp``
Overwrite policy: image_1 is overwritten unconditionally on every run.
"""
from __future__ import annotations

import os
import sys
from typing import Any

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandParser

from recipes.models import Recipe
from recipes.services import storage as storage_service
from recipes.utils.names import normalize

BUCKET = "recipe_images"
OFFICIAL_USERNAME = "nutrichoice"


class Command(BaseCommand):
    help = (
        "Upload curated recipe .webp images to Supabase Storage and persist each "
        "public URL on the matching Recipe row (image_1)."
    )

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
            help="Print the upload plan without touching Supabase or the DB.",
        )
        parser.add_argument(
            "--allow-partial",
            action="store_true",
            help="Continue past unmatched files/recipes instead of exiting non-zero.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        image_dir = os.path.expanduser(options["dir"])
        dry_run: bool = options["dry_run"]
        allow_partial: bool = options["allow_partial"]

        if not os.path.isdir(image_dir):
            self.stderr.write(self.style.ERROR(f"Directory not found: {image_dir}"))
            sys.exit(1)

        User = get_user_model()
        try:
            official = User.objects.get(username=OFFICIAL_USERNAME)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(
                f"Official user '{OFFICIAL_USERNAME}' not found. "
                f"Run `python manage.py seed_official_data` first."
            ))
            sys.exit(1)

        # --- Collect .webp files (ignore Zone.Identifier metadata) ---
        webp_files = sorted(
            f for f in os.listdir(image_dir)
            if f.lower().endswith(".webp") and "Zone.Identifier" not in f
        )
        if not webp_files:
            self.stderr.write(self.style.WARNING("No .webp files found."))
            sys.exit(1)

        # --- Build lookup maps from DB ---
        recipes = list(Recipe.objects.only("pk", "name", "image_1"))
        exact_map: dict[str, Recipe] = {r.name.lower(): r for r in recipes}
        fuzzy_map: dict[str, Recipe] = {normalize(r.name): r for r in recipes}

        # --- Resolve every file first; abort before any upload if there are issues ---
        plan: list[tuple[str, Recipe]] = []
        unmatched_files: list[str] = []
        for filename in webp_files:
            stem = os.path.splitext(filename)[0]
            recipe = exact_map.get(stem.lower()) or fuzzy_map.get(normalize(stem))
            if recipe is None:
                unmatched_files.append(filename)
                continue
            plan.append((filename, recipe))

        matched_recipe_ids = {r.pk for _, r in plan}
        missing_images = [r.name for r in recipes if r.pk not in matched_recipe_ids]

        self.stdout.write(
            f"Matched {len(plan)} file(s) to recipes. "
            f"Unmatched files: {len(unmatched_files)}. "
            f"Recipes without image: {len(missing_images)}."
        )

        if unmatched_files:
            self.stdout.write(self.style.WARNING("Unmatched files:"))
            for f in unmatched_files:
                self.stdout.write(f"    {f}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\nDRY RUN — planned uploads:"))
            for filename, recipe in plan:
                path = f"{official.pk}/{recipe.pk}/0.webp"
                self.stdout.write(f"  {filename!r} -> recipe id={recipe.pk} ({recipe.name!r}) -> {path}")
            return

        if unmatched_files and not allow_partial:
            self.stderr.write(self.style.ERROR(
                "Aborting: unmatched files present. Re-run with --allow-partial to proceed."
            ))
            sys.exit(1)

        # --- Upload + persist ---
        uploaded = 0
        failed: list[tuple[str, str]] = []
        for filename, recipe in plan:
            path = f"{official.pk}/{recipe.pk}/0.webp"
            src = os.path.join(image_dir, filename)
            try:
                with open(src, "rb") as fh:
                    content = fh.read()
                storage_service.upload_file(BUCKET, path, content)
                public_url = storage_service.get_public_url(BUCKET, path)
                Recipe.objects.filter(pk=recipe.pk).update(image_1=public_url)
            except Exception as exc:  # noqa: BLE001
                failed.append((filename, str(exc)))
                self.stderr.write(self.style.ERROR(f"  FAIL {filename}: {exc}"))
                continue
            uploaded += 1
            self.stdout.write(self.style.SUCCESS(
                f"  ok  {filename} -> recipe id={recipe.pk} ({recipe.name!r})"
            ))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Uploaded: {uploaded}"))
        if failed:
            self.stdout.write(self.style.ERROR(f"Failed: {len(failed)}"))
            for filename, err in failed:
                self.stdout.write(f"    {filename}: {err}")

        if missing_images:
            self.stdout.write(self.style.WARNING(
                f"\n{len(missing_images)} DB recipe(s) still have no image:"
            ))
            for name in missing_images:
                self.stdout.write(f"    {name}")

        if failed or (unmatched_files and not allow_partial):
            sys.exit(1)
