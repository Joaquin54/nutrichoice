"""Make Recipe.meal_type NOT NULL now that all rows have been backfilled."""
from django.db import migrations, models


class Migration(migrations.Migration):

  dependencies = [
    ("recipes", "0012_backfill_meal_type_and_prep_time"),
  ]

  operations = [
    migrations.AlterField(
      model_name="recipe",
      name="meal_type",
      field=models.CharField(
        max_length=9,
        choices=[
          ("Breakfast", "Breakfast"),
          ("Lunch", "Lunch"),
          ("Dinner", "Dinner"),
        ],
      ),
    ),
  ]
