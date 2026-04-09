from decimal import Decimal, ROUND_HALF_UP

from rest_framework import serializers

from meal_planning.models import MealPlanEntry
from recipes.models import Recipe


class MealPlanRecipeSerializer(serializers.ModelSerializer):
  """
  Lightweight read-only representation of a Recipe for use inside meal plan responses.

  Exposes the fields needed to render a MealCell in the frontend: id, name, image,
  dietary_tags, cuisine_type, servings, and per-serving macros (from the related
  RecipeNutrition row divided by recipe.servings).
  Ingredients and instructions are omitted for payload efficiency.
  """

  calories = serializers.SerializerMethodField()
  protein = serializers.SerializerMethodField()
  carbs = serializers.SerializerMethodField()
  fat = serializers.SerializerMethodField()

  def _get_nutrition_field(self, obj: Recipe, field: str) -> str | None:
    """
    Return a per-serving nutrition field value as a decimal string, or None
    if no RecipeNutrition row is linked.

    Divides the total recipe nutrition value by the number of servings.

    Params:
      obj: The Recipe instance being serialized.
      field: The RecipeNutrition field name to read.

    Returns:
      Per-serving value as a string (e.g. "250.00") or None.
    """
    nutrition = getattr(obj, "nutrition", None)
    if nutrition is None:
      return None
    total = Decimal(str(getattr(nutrition, field)))
    servings = Decimal(str(obj.servings or 1))
    per_serving = (total / servings).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return str(per_serving)

  def get_calories(self, obj: Recipe) -> str | None:
    return self._get_nutrition_field(obj, "calories")

  def get_protein(self, obj: Recipe) -> str | None:
    return self._get_nutrition_field(obj, "protein")

  def get_carbs(self, obj: Recipe) -> str | None:
    return self._get_nutrition_field(obj, "carbs")

  def get_fat(self, obj: Recipe) -> str | None:
    return self._get_nutrition_field(obj, "fat")

  class Meta:
    model = Recipe
    fields = [
      "id", "name", "image_1", "dietary_tags", "cuisine_type",
      "servings", "calories", "protein", "carbs", "fat",
    ]
    read_only_fields = [
      "id", "name", "image_1", "dietary_tags", "cuisine_type",
      "servings", "calories", "protein", "carbs", "fat",
    ]


class MealPlanEntrySerializer(serializers.ModelSerializer):
  """
  Read serializer for a single MealPlanEntry.

  Nests a lightweight recipe representation. Used in both the week grid response
  and the POST /api/meal-plan/entry/ response body.
  """

  recipe = MealPlanRecipeSerializer(read_only=True)

  class Meta:
    model = MealPlanEntry
    fields = ["id", "date", "meal_slot", "recipe", "created_at"]
    read_only_fields = ["id", "date", "meal_slot", "recipe", "created_at"]


class MealPlanEntryCreateSerializer(serializers.Serializer):
  """
  Write serializer for creating or replacing a meal plan entry.

  Accepts date, meal_slot, and recipe_id. Input validation ensures the slot is
  a valid MealSlot choice and that the date is a well-formed ISO date.
  Recipe existence is validated in the view to return a proper 404.

  Params:
    date (DateField): The date for the meal plan entry.
    meal_slot (ChoiceField): One of breakfast | snack1 | lunch | snack2 | dinner.
    recipe_id (IntegerField): PK of the Recipe to assign to the slot.
  """

  date = serializers.DateField()
  meal_slot = serializers.ChoiceField(choices=MealPlanEntry.MealSlot.choices)
  recipe_id = serializers.IntegerField(min_value=1)
