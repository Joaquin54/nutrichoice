from django.apps import AppConfig


class MealPlanningConfig(AppConfig):
  """Django app config for the meal_planning domain."""

  default_auto_field = "django.db.models.BigAutoField"
  name = "meal_planning"
  verbose_name = "Meal Planning"
