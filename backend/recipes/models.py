from django.db import models
from django.contrib.postgres.fields import ArrayField
from ingredients.models import Ingredient


# Create your models here.
class Recipe(models.Model):
    """
    Record of recipes
    """

    id = models.BigAutoField(primary_key=True)
    # public_id = modles. Maybe?
    name = models.CharField(max_length=30, unique=True)
    date_created = models.DateTimeField(auto_now=True)
    intstructions = models.TextField(max_length=300)
    description = models.TextField(max_length=500)
    cuisine_type = models.TextField(max_length=12)
    dietary_tags = ArrayField(models.CharField(max_length=12))

    class Meta:
        db_table = "recipe"
        verbose_name = "Recipe"
        verbose_name_plural = "Recipes"

class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="ingrdients"
    )

    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
    )

    quantity = models.FloatField()
    unit = models.CharField(max_length=20)


class RecipeInstruction(models.Model):
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="instructions"
    )

    step_number = models.PositiveSmallIntegerField()
    text = models.TextField()

    estimated_cooktime = models.PositiveSmallIntegerField(
        null=True, blank=True)
