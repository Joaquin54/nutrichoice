"""
Backfill Recipe.meal_type and RecipeInstruction.estimated_cooktime (step 1 only)
from the legacy description format "Meal: <type>; Prep time: <N> min".

Rows that do not match are skipped and logged — the migration never aborts on
parse failure.  Description tokens are removed; any other content is preserved.
"""
import logging
import re

from django.db import migrations

logger = logging.getLogger(__name__)

# Matches "Meal: Lunch" (case-sensitive value, tolerates surrounding whitespace).
_MEAL_RE = re.compile(r"Meal:\s*([^;]+?)(?:;|$)")
# Matches "Prep time: 60 min" — captures the integer only.
_PREP_RE = re.compile(r"Prep time:\s*(\d+)\s*min(?:;|$)?")
# Strips both tokens (and any leading/trailing "; " artefacts) from description.
_TOKEN_RE = re.compile(
  r"(?:Meal:\s*[^;]+?(?:;|$)|Prep time:\s*\d+\s*min(?:;|$)?)"
)

VALID_MEAL_TYPES: frozenset[str] = frozenset({"Breakfast", "Lunch", "Dinner"})


def _clean_description(description: str) -> str:
  """Remove both legacy tokens and normalise whitespace / trailing semicolons."""
  cleaned = _TOKEN_RE.sub("", description)
  # Strip stray semicolons and collapse internal whitespace.
  cleaned = re.sub(r"[;]+", ";", cleaned)
  cleaned = cleaned.strip("; \t\n")
  return cleaned


def forwards(apps: object, schema_editor: object) -> None:
  Recipe = apps.get_model("recipes", "Recipe")
  RecipeInstruction = apps.get_model("recipes", "RecipeInstruction")

  for recipe in Recipe.objects.all():
    description: str = recipe.description or ""
    original_description = description

    meal_match = _MEAL_RE.search(description)
    prep_match = _PREP_RE.search(description)

    # --- meal_type ---
    if meal_match:
      raw_meal = meal_match.group(1).strip()
      if raw_meal in VALID_MEAL_TYPES:
        recipe.meal_type = raw_meal
      else:
        logger.warning(
          "Recipe pk=%s name=%r: unrecognised meal type %r — skipping meal_type.",
          recipe.pk, recipe.name, raw_meal,
        )
    else:
      logger.warning(
        "Recipe pk=%s name=%r: no 'Meal:' token found — skipping meal_type.",
        recipe.pk, recipe.name,
      )

    # --- clean description regardless of match outcome ---
    recipe.description = _clean_description(original_description)
    recipe.save(update_fields=["description", "meal_type"])

    # --- estimated_cooktime on step 1 instruction only ---
    if prep_match:
      try:
        minutes = int(prep_match.group(1))
      except ValueError:
        logger.warning(
          "Recipe pk=%s name=%r: could not parse prep time %r as int — skipping.",
          recipe.pk, recipe.name, prep_match.group(1),
        )
        continue

      try:
        instruction = RecipeInstruction.objects.get(
          recipe=recipe, step_number=1
        )
        instruction.estimated_cooktime = minutes
        instruction.save(update_fields=["estimated_cooktime"])
      except RecipeInstruction.DoesNotExist:
        logger.warning(
          "Recipe pk=%s name=%r: no step_number=1 instruction found — "
          "estimated_cooktime not set.",
          recipe.pk, recipe.name,
        )
    else:
      logger.warning(
        "Recipe pk=%s name=%r: no 'Prep time:' token found — "
        "estimated_cooktime not set.",
        recipe.pk, recipe.name,
      )


def backwards(apps: object, schema_editor: object) -> None:
  """
  Re-inject the legacy tokens into description and clear meal_type /
  estimated_cooktime so the migration is fully reversible.

  Note: description content that existed *before* migration 0012 is
  already preserved (we only stripped our own tokens), so reversal
  restores the original format faithfully for rows that had both tokens.
  Rows that had no tokens remain unchanged.
  """
  Recipe = apps.get_model("recipes", "Recipe")
  RecipeInstruction = apps.get_model("recipes", "RecipeInstruction")

  for recipe in Recipe.objects.all():
    parts: list[str] = []

    if recipe.meal_type:
      parts.append(f"Meal: {recipe.meal_type}")

    # Recover prep time from step 1 instruction (if any).
    try:
      instruction = RecipeInstruction.objects.get(
        recipe=recipe, step_number=1
      )
      if instruction.estimated_cooktime is not None:
        parts.append(f"Prep time: {instruction.estimated_cooktime} min")
        instruction.estimated_cooktime = None
        instruction.save(update_fields=["estimated_cooktime"])
    except RecipeInstruction.DoesNotExist:
      pass

    if parts:
      existing = recipe.description.strip() if recipe.description else ""
      token_str = "; ".join(parts)
      recipe.description = (
        f"{token_str}; {existing}" if existing else token_str
      )

    recipe.meal_type = None
    recipe.save(update_fields=["description", "meal_type"])


class Migration(migrations.Migration):

  dependencies = [
    ("recipes", "0011_recipe_meal_type"),
  ]

  operations = [
    migrations.RunPython(forwards, backwards),
  ]
