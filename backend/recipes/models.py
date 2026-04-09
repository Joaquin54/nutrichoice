from uuid import uuid4

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models

from ingredients.models import Ingredient


# Create your models here.
class Recipe(models.Model):
    """
    Record of recipes
    """

    class MeasureType(models.TextChoices):
        GRAMS = "grams", "Grams"
        CUPS = "cups", "Cups"
        TABLESPOONS = "tablespoons", "Tablespoons"

    id = models.BigAutoField(primary_key=True)
    # public_id = modles. Maybe?
    name = models.CharField(max_length=30, unique=True)
    date_created = models.DateTimeField(auto_now=True)
    description = models.TextField(max_length=500)
    cuisine_type = models.TextField(max_length=20)
    dietary_tags = ArrayField(models.CharField(max_length=25))
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="recipe_creator"
    )
    measure_type = models.CharField(
        max_length=12,
        choices=MeasureType.choices,
        default=MeasureType.GRAMS,
    )
    servings = models.PositiveSmallIntegerField(default=1)
    image_1 = models.URLField(max_length=500, blank=True, default='')
    image_2 = models.URLField(max_length=500, blank=True, default='')
    image_3 = models.URLField(max_length=500, blank=True, default='')

    class Meta:
        db_table = "recipe"
        verbose_name = "Recipe"
        verbose_name_plural = "Recipes"
        indexes = [
            models.Index(fields=["creator"], name="ix_recipe_creator"),
            models.Index(fields=["-date_created"], name="ix_recipe_date_created"),
            models.Index(fields=["cuisine_type"], name="ix_recipe_cuisine_type"),
        ]


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="ingredients"
    )

    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
    )

    quantity = models.FloatField()
    unit = models.CharField(max_length=20)

    class Meta:
        indexes = [
            models.Index(
                fields=["recipe", "ingredient"],
                name="ix_ri_recipe_ingredient",
            ),
        ]


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


class Cookbook(models.Model):
    """
    A named collection of recipes belonging to a single user.
    Each user may have multiple cookbooks, but names must be unique per owner.
    """

    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(default=uuid4, editable=False, unique=True)
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cookbooks",
    )
    description = models.CharField(max_length=300, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} (owner: {self.owner_id})"

    class Meta:
        db_table = "cookbooks"
        verbose_name = "Cookbook"
        verbose_name_plural = "Cookbooks"
        ordering = ["-date_updated"]

        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"],
                name="uq_cookbook_owner_name",
            )
        ]

        indexes = [
            models.Index(fields=["owner"], name="ix_cookbook_owner"),
            models.Index(fields=["date_updated"], name="ix_cookbook_date_updated"),
        ]


class CookbookRecipe(models.Model):
    """
    Join table linking recipes to cookbooks.
    A recipe may appear in multiple cookbooks; a cookbook may contain many recipes.
    Each (cookbook, recipe) pair is unique.
    """

    id = models.BigAutoField(primary_key=True)
    cookbook = models.ForeignKey(
        Cookbook,
        on_delete=models.CASCADE,
        related_name="cookbook_recipes",
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="in_cookbooks",
    )
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Recipe {self.recipe_id} in Cookbook {self.cookbook_id}"

    class Meta:
        db_table = "cookbook_recipes"
        verbose_name = "Cookbook Recipe"
        verbose_name_plural = "Cookbook Recipes"
        ordering = ["-date_added"]

        constraints = [
            models.UniqueConstraint(
                fields=["cookbook", "recipe"],
                name="uq_cookbookrecipe_cookbook_recipe",
            )
        ]

        indexes = [
            models.Index(fields=["cookbook"], name="ix_cookbookrecipe_cookbook"),
            models.Index(fields=["recipe"], name="ix_cookbookrecipe_recipe"),
        ]
