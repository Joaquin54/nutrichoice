from decimal import Decimal, ROUND_HALF_UP

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from nutrition.models import RecipeNutrition
from recipes.models import Recipe


def _per_serving(total: Decimal, servings: int) -> str:
    """Divide a total nutrition value by servings and return as a string."""
    s = Decimal(str(max(servings, 1)))
    return str((total / s).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


class RecipeNutritionView(APIView):
    """
    Returns the pre-computed nutritional totals for a recipe, plus per-serving values.

    GET /api/recipes/<recipe_id>/nutrition/

    Auth: Requires authentication (enforced by global DEFAULT_PERMISSION_CLASSES).
    """

    def get(self, request, recipe_id: int) -> Response:
        try:
            nutrition = RecipeNutrition.objects.select_related("recipe").get(
                recipe_id=recipe_id
            )
        except RecipeNutrition.DoesNotExist:
            if not Recipe.objects.filter(pk=recipe_id).exists():
                return Response(
                    {"error": "Recipe not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(
                {"error": "Nutrition data not available for this recipe."},
                status=status.HTTP_404_NOT_FOUND,
            )

        servings: int = nutrition.recipe.servings or 1

        return Response(
            {
                "servings": servings,
                "total": {
                    "calories": str(nutrition.calories),
                    "protein": str(nutrition.protein),
                    "carbs": str(nutrition.carbs),
                    "fat": str(nutrition.fat),
                    "fiber": str(nutrition.fiber),
                    "sugar": str(nutrition.sugar),
                    "sodium": str(nutrition.sodium),
                },
                "per_serving": {
                    "calories": _per_serving(nutrition.calories, servings),
                    "protein": _per_serving(nutrition.protein, servings),
                    "carbs": _per_serving(nutrition.carbs, servings),
                    "fat": _per_serving(nutrition.fat, servings),
                    "fiber": _per_serving(nutrition.fiber, servings),
                    "sugar": _per_serving(nutrition.sugar, servings),
                    "sodium": _per_serving(nutrition.sodium, servings),
                },
                "calculated_at": nutrition.calculated_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )
