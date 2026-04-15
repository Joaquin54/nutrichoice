from __future__ import annotations

from django.contrib.postgres.fields import ArrayField
from django.db import migrations, models


def normalize_forward(apps: object, schema_editor: object) -> None:
  """
  Backfill all Recipe rows so that dietary_tags only contains canonical
  ALLOWED_DIET_KEYS entries.  Malformed compound strings like "Keto, Lunch"
  are split and the non-diet tokens ("Regular", "Lunch", "Pesca", …) are
  dropped.
  """
  from recipes.services.diet_tags import normalize_dietary_tags

  Recipe = apps.get_model("recipes", "Recipe")  # type: ignore[attr-defined]
  to_update: list = []
  for recipe in Recipe.objects.all().only("id", "dietary_tags").iterator(chunk_size=500):
    normalized: list[str] = normalize_dietary_tags(recipe.dietary_tags or [])
    if normalized != recipe.dietary_tags:
      recipe.dietary_tags = normalized
      to_update.append(recipe)
  if to_update:
    Recipe.objects.bulk_update(to_update, ["dietary_tags"])


class Migration(migrations.Migration):

  dependencies = [
    ("recipes", "0013_recipe_meal_type_not_null"),
  ]

  operations = [
    migrations.AlterField(
      model_name="recipe",
      name="dietary_tags",
      field=ArrayField(
        models.CharField(max_length=25),
        blank=True,
        default=list,
      ),
    ),
    migrations.RunPython(normalize_forward, reverse_code=migrations.RunPython.noop),
  ]
