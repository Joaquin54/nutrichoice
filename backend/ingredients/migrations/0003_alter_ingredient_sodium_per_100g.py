from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ingredients", "0002_alter_ingredient_calories_per_100g_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ingredient",
            name="sodium_per_100g",
            field=models.DecimalField(decimal_places=2, max_digits=8),
        ),
    ]
