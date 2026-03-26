from django.contrib.postgres.fields import ArrayField
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recipes", "0004_cookbook_description"),
    ]

    operations = [
        migrations.AlterField(
            model_name="recipe",
            name="cuisine_type",
            field=models.TextField(max_length=20),
        ),
        migrations.AlterField(
            model_name="recipe",
            name="dietary_tags",
            field=ArrayField(models.CharField(max_length=25)),
        ),
    ]
