from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from nutrition.models import RecipeNutrition
from nutrition.services.conversions import convert_to_grams

NUTRIENTS: tuple[str, ...] = (
    "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium",
)


@dataclass(frozen=True)
class NutritionResult:
    ok: bool
    calories: Decimal = Decimal("0.00")
    protein: Decimal = Decimal("0.00")
    carbs: Decimal = Decimal("0.00")
    fat: Decimal = Decimal("0.00")
    fiber: Decimal = Decimal("0.00")
    sugar: Decimal = Decimal("0.00")
    sodium: Decimal = Decimal("0.00")
    reason: Optional[str] = None


def _calculate_totals(recipe_ingredients) -> dict[str, Decimal]:
    """
    Sum nutrient totals across all recipe ingredients.
    Converts each ingredient's quantity to grams before applying
    the per-100g scaling factor.

    Time complexity: O(I) where I = number of ingredients.
    (7 nutrients is a constant factor.)
    """
    totals: dict[str, Decimal] = {n: Decimal("0.00") for n in NUTRIENTS}

    for ri in recipe_ingredients:
        qty_grams = convert_to_grams(
            quantity=Decimal(str(ri.quantity)),
            unit=ri.unit,
            ingredient_name=ri.ingredient.name,
        )
        scale = qty_grams / Decimal("100")

        for nutrient in NUTRIENTS:
            per_100g = getattr(ri.ingredient, f"{nutrient}_per_100g")
            totals[nutrient] += Decimal(str(per_100g)) * scale

    return {
        n: v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        for n, v in totals.items()
    }


def compute_and_store_nutrition(*, recipe) -> NutritionResult:
    """
    Compute nutritional totals for a recipe and persist them
    to the RecipeNutrition table.

    Must be called inside an existing transaction.atomic() block.
    Does NOT manage its own transaction because the caller
    (CreateRecipeSerializer.create) already wraps the operation.

    Raises ValueError if any ingredient uses an unsupported unit.
    """
    ingredients = recipe.ingredients.select_related("ingredient").all()

    if not ingredients.exists():
        return NutritionResult(ok=False, reason="no_ingredients")

    totals = _calculate_totals(ingredients)

    RecipeNutrition.objects.create(
        recipe=recipe,
        calories=totals["calories"],
        protein=totals["protein"],
        carbs=totals["carbs"],
        fat=totals["fat"],
        fiber=totals["fiber"],
        sugar=totals["sugar"],
        sodium=totals["sodium"],
    )

    return NutritionResult(
        ok=True,
        calories=totals["calories"],
        protein=totals["protein"],
        carbs=totals["carbs"],
        fat=totals["fat"],
        fiber=totals["fiber"],
        sugar=totals["sugar"],
        sodium=totals["sodium"],
    )
