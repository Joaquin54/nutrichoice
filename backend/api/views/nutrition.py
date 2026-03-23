from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, ROUND_HALF_UP
from recipes.models import Recipe


class RecipeNutritionView(APIView):
    """
    Returns the total nutritional value of a recipe based on ingredient
    quantities (quantity assumed to be in grams).

    GET /api/recipes/<recipe_id>/nutrition/
    """

    NUTRIENTS = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]

    def get(self, request, recipe_id):
        try:
            recipe = Recipe.objects.prefetch_related(
                "ingredients__ingredient"
            ).get(pk=recipe_id)
        except Recipe.DoesNotExist:
            return Response(
                {"error": "Recipe not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        totals = self._calculate_totals(recipe)
        return Response(totals, status=status.HTTP_200_OK)

    def _calculate_totals(self, recipe) -> dict:
        totals = {n: Decimal("0.00") for n in self.NUTRIENTS}

        for ri in recipe.ingredients.all():
            ing = ri.ingredient
            qty = Decimal(str(ri.quantity))
            scale = qty / Decimal("100")

            for nutrient in self.NUTRIENTS:
                per_100g = Decimal(str(getattr(ing, f"{nutrient}_per_100g")))
                totals[nutrient] += per_100g * scale

        return {
            n: str(v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
            for n, v in totals.items()
        }
