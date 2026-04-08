from django.conf import settings
from django.db import models


class MealPlanEntry(models.Model):
  """
  Represents a single recipe assigned to a meal slot on a specific date for a user.

  Each (user, date, meal_slot) combination is unique — only one recipe per slot per day.
  Slot values match the frontend MealType: breakfast | snack1 | lunch | snack2 | dinner.
  """

  class MealSlot(models.TextChoices):
    BREAKFAST = "breakfast", "Breakfast"
    SNACK1 = "snack1", "Snack 1"
    LUNCH = "lunch", "Lunch"
    SNACK2 = "snack2", "Snack 2"
    DINNER = "dinner", "Dinner"

  id = models.BigAutoField(primary_key=True)
  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="meal_plan_entries",
  )
  date = models.DateField()
  meal_slot = models.CharField(
    max_length=10,
    choices=MealSlot.choices,
  )
  recipe = models.ForeignKey(
    "recipes.Recipe",
    on_delete=models.CASCADE,
    related_name="meal_plan_entries",
  )
  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    db_table = "meal_plan_entries"
    verbose_name = "Meal Plan Entry"
    verbose_name_plural = "Meal Plan Entries"
    ordering = ["date", "meal_slot"]
    constraints = [
      models.UniqueConstraint(
        fields=["user", "date", "meal_slot"],
        name="uq_mealplan_user_date_slot",
      )
    ]
    indexes = [
      models.Index(fields=["user", "date"], name="ix_mealplan_user_date"),
    ]

  def __str__(self) -> str:
    return f"{self.user} — {self.date} — {self.meal_slot}"
