from django.db import models


class RecipeNutrition(models.Model):
    """
    Pre-computed nutritional totals for a recipe.
    Values represent the sum across all recipe ingredients
    (each ingredient's per-100g value scaled by its quantity in grams).
    """

    recipe = models.OneToOneField(
        "recipes.Recipe", on_delete=models.CASCADE, related_name="nutrition"
    )
    calories = models.DecimalField(max_digits=8, decimal_places=2)
    protein = models.DecimalField(max_digits=8, decimal_places=2)
    carbs = models.DecimalField(max_digits=8, decimal_places=2)
    fat = models.DecimalField(max_digits=8, decimal_places=2)
    fiber = models.DecimalField(max_digits=8, decimal_places=2)
    sugar = models.DecimalField(max_digits=8, decimal_places=2)
    sodium = models.DecimalField(max_digits=8, decimal_places=2)
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "recipe_nutrition"
        verbose_name = "Recipe Nutrition"
        verbose_name_plural = "Recipe Nutritions"
