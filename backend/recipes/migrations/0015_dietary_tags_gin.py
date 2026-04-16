from django.contrib.postgres.indexes import GinIndex
from django.db import migrations


class Migration(migrations.Migration):

  dependencies = [
    ("recipes", "0014_normalize_dietary_tags"),
  ]

  operations = [
    migrations.AddIndex(
      model_name="recipe",
      index=GinIndex(fields=["dietary_tags"], name="ix_recipe_dietary_tags_gin"),
    ),
  ]
