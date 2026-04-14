"""Add nullable meal_type CharField to Recipe — schema only."""
from django.db import migrations, models


class Migration(migrations.Migration):

  dependencies = [
    ("recipes", "0010_fix_recipe_name_typos"),
  ]

  operations = [
    migrations.AddField(
      model_name="recipe",
      name="meal_type",
      field=models.CharField(
        max_length=9,
        choices=[
          ("Breakfast", "Breakfast"),
          ("Lunch", "Lunch"),
          ("Dinner", "Dinner"),
        ],
        null=True,
        blank=True,
      ),
    ),
  ]
