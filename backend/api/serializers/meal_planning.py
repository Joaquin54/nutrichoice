from rest_framework import serializers

from meal_planning.models import MealPlanEntry
from recipes.models import Recipe


class MealPlanRecipeSerializer(serializers.ModelSerializer):
  """
  Lightweight read-only representation of a Recipe for use inside meal plan responses.

  Only exposes the fields needed to render a MealCell in the frontend: id, name,
  image, dietary_tags, and cuisine_type. Ingredients and instructions are omitted.
  """

  class Meta:
    model = Recipe
    fields = ["id", "name", "image_1", "dietary_tags", "cuisine_type"]
    read_only_fields = ["id", "name", "image_1", "dietary_tags", "cuisine_type"]


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
