"""Fix two typos in official recipe names so they match the curated image files."""
from django.db import migrations


RENAMES = [
    ("Chicken Rice Bow", "Chicken Rice Bowl"),
    ("Broccoli Burgers", "Broccoli Burger"),
]


def forwards(apps, schema_editor):
    Recipe = apps.get_model("recipes", "Recipe")
    for old, new in RENAMES:
        Recipe.objects.filter(name=old).update(name=new)


def backwards(apps, schema_editor):
    Recipe = apps.get_model("recipes", "Recipe")
    for old, new in RENAMES:
        Recipe.objects.filter(name=new).update(name=old)


class Migration(migrations.Migration):

    dependencies = [
        ("recipes", "0009_add_servings_field"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
