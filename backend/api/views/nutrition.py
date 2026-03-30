from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from nutrition.models import RecipeNutrition
from recipes.models import Recipe


class RecipeNutritionView(APIView):
    """
    Returns the pre-computed nutritional totals for a recipe.

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

        return Response(
            {
                "calories": str(nutrition.calories),
                "protein": str(nutrition.protein),
                "carbs": str(nutrition.carbs),
                "fat": str(nutrition.fat),
                "fiber": str(nutrition.fiber),
                "sugar": str(nutrition.sugar),
                "sodium": str(nutrition.sodium),
                "calculated_at": nutrition.calculated_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )
