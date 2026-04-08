from django.contrib import admin

from meal_planning.models import MealPlanEntry


@admin.register(MealPlanEntry)
class MealPlanEntryAdmin(admin.ModelAdmin):
  """Admin configuration for MealPlanEntry."""

  list_display = ["user", "date", "meal_slot", "recipe", "created_at"]
  list_filter = ["meal_slot", "date"]
  search_fields = ["user__username", "recipe__name"]
  ordering = ["-date", "meal_slot"]
  date_hierarchy = "date"
