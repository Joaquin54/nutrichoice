import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from ingredients.models import Ingredient
from meal_planning.models import MealPlanEntry
from nutrition.models import RecipeNutrition
from profiles.models import UserProfile
from recipes.models import Recipe, RecipeIngredient

User = get_user_model()

WEEK_URL = "/api/meal-plan/week/"
MACROS_URL = "/api/meal-plan/macros/"
ENTRY_URL = "/api/meal-plan/entry/"


def _make_user(username: str) -> object:
  """Create a user with a unique email to satisfy the users.email unique constraint."""
  return User.objects.create_user(
    username=username,
    password="testpass123",
    email=f"{username}@test.com",
  )


def _make_recipe(name: str, creator=None) -> Recipe:
  return Recipe.objects.create(
    name=name,
    description="A test recipe.",
    cuisine_type="Test",
    dietary_tags=[],
    creator=creator,
  )


def _make_nutrition(recipe: Recipe, calories: int = 400, protein: int = 30,
                    carbs: int = 50, fat: int = 10) -> RecipeNutrition:
  return RecipeNutrition.objects.create(
    recipe=recipe,
    calories=Decimal(str(calories)),
    protein=Decimal(str(protein)),
    carbs=Decimal(str(carbs)),
    fat=Decimal(str(fat)),
    fiber=Decimal("5.00"),
    sugar=Decimal("5.00"),
    sodium=Decimal("100.00"),
  )


class WeekPlanViewTestCase(TestCase):
  """Tests for GET /api/meal-plan/week/."""

  def setUp(self) -> None:
    self.user = _make_user("weekuser")
    self.other_user = _make_user("otherweek")
    self.recipe = _make_recipe("Oatmeal", creator=self.user)
    self.client = APIClient()
    self.client.force_authenticate(user=self.user)
    # 2026-04-05 is a Sunday
    self.sunday = "2026-04-05"

  def test_returns_7_days(self) -> None:
    """Response contains exactly 7 day objects."""
    response = self.client.get(WEEK_URL, {"week_start": self.sunday})
    self.assertEqual(response.status_code, 200)
    data = response.json()
    self.assertEqual(len(data["days"]), 7)

  def test_all_slots_present_and_null_when_empty(self) -> None:
    """Each day contains all 5 slots; empty slots are null."""
    response = self.client.get(WEEK_URL, {"week_start": self.sunday})
    day = response.json()["days"][0]
    self.assertIn("meals", day)
    for slot in ("breakfast", "snack1", "lunch", "snack2", "dinner"):
      self.assertIn(slot, day["meals"])
      self.assertIsNone(day["meals"][slot])

  def test_assigned_meal_appears_in_correct_slot(self) -> None:
    """A created entry appears in the correct slot with recipe data."""
    MealPlanEntry.objects.create(
      user=self.user,
      date=datetime.date(2026, 4, 5),
      meal_slot="breakfast",
      recipe=self.recipe,
    )
    response = self.client.get(WEEK_URL, {"week_start": self.sunday})
    self.assertEqual(response.status_code, 200)
    day0 = response.json()["days"][0]
    breakfast = day0["meals"]["breakfast"]
    self.assertIsNotNone(breakfast)
    self.assertEqual(breakfast["recipe"]["name"], "Oatmeal")

  def test_user_isolation(self) -> None:
    """Other user's entries do not appear in the response."""
    MealPlanEntry.objects.create(
      user=self.other_user,
      date=datetime.date(2026, 4, 5),
      meal_slot="dinner",
      recipe=self.recipe,
    )
    response = self.client.get(WEEK_URL, {"week_start": self.sunday})
    day0 = response.json()["days"][0]
    self.assertIsNone(day0["meals"]["dinner"])

  def test_snaps_non_sunday_to_sunday(self) -> None:
    """Passing a non-Sunday date snaps back to the containing Sunday."""
    # 2026-04-07 is a Tuesday — should snap to 2026-04-05
    response = self.client.get(WEEK_URL, {"week_start": "2026-04-07"})
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.json()["week_start"], "2026-04-05")

  def test_missing_week_start_returns_400(self) -> None:
    response = self.client.get(WEEK_URL)
    self.assertEqual(response.status_code, 400)

  def test_malformed_date_returns_400(self) -> None:
    response = self.client.get(WEEK_URL, {"week_start": "not-a-date"})
    self.assertEqual(response.status_code, 400)

  def test_unauthenticated_returns_401(self) -> None:
    anon = APIClient()
    response = anon.get(WEEK_URL, {"week_start": self.sunday})
    self.assertEqual(response.status_code, 401)

  def test_week_start_in_response(self) -> None:
    """Response includes week_start key with the (possibly snapped) Sunday."""
    response = self.client.get(WEEK_URL, {"week_start": self.sunday})
    self.assertEqual(response.json()["week_start"], self.sunday)


class DailyMacrosViewTestCase(TestCase):
  """Tests for GET /api/meal-plan/macros/."""

  def setUp(self) -> None:
    self.user = _make_user("macrouser")
    # Explicitly create a UserProfile — registration view handles this in production,
    # but direct user creation in tests does not trigger the same code path.
    self.profile = UserProfile.objects.create(user=self.user)
    self.recipe_a = _make_recipe("Chicken Bowl", creator=self.user)
    self.recipe_b = _make_recipe("Salad", creator=self.user)
    _make_nutrition(self.recipe_a, calories=500, protein=40, carbs=50, fat=15)
    _make_nutrition(self.recipe_b, calories=200, protein=10, carbs=30, fat=5)
    self.client = APIClient()
    self.client.force_authenticate(user=self.user)
    self.date = datetime.date(2026, 4, 7)

  def test_aggregates_multiple_meals(self) -> None:
    """Totals sum across all entries for the date."""
    MealPlanEntry.objects.create(
      user=self.user, date=self.date, meal_slot="lunch", recipe=self.recipe_a
    )
    MealPlanEntry.objects.create(
      user=self.user, date=self.date, meal_slot="dinner", recipe=self.recipe_b
    )
    response = self.client.get(MACROS_URL, {"date": str(self.date)})
    self.assertEqual(response.status_code, 200)
    data = response.json()
    self.assertEqual(data["totals"]["calories"], "700.00")
    self.assertEqual(data["totals"]["protein"], "50.00")
    self.assertEqual(data["totals"]["carbs"], "80.00")
    self.assertEqual(data["totals"]["fat"], "20.00")

  def test_empty_day_returns_zeros(self) -> None:
    """A day with no entries returns zero totals."""
    response = self.client.get(MACROS_URL, {"date": str(self.date)})
    self.assertEqual(response.status_code, 200)
    data = response.json()
    self.assertEqual(data["totals"]["calories"], "0.00")
    self.assertEqual(data["totals"]["protein"], "0.00")

  def test_returns_user_targets_from_profile(self) -> None:
    """Targets come from the user's UserProfile goals."""
    self.profile.daily_calorie_goal = 2500
    self.profile.daily_protein_goal = 180
    self.profile.daily_carbs_goal = 300
    self.profile.daily_fat_goal = 70
    self.profile.save()

    response = self.client.get(MACROS_URL, {"date": str(self.date)})
    targets = response.json()["targets"]
    self.assertEqual(targets["calories"], 2500)
    self.assertEqual(targets["protein"], 180)
    self.assertEqual(targets["carbs"], 300)
    self.assertEqual(targets["fat"], 70)

  def test_defaults_when_profile_goals_are_null(self) -> None:
    """Default targets (2000/120/250/65) are used when profile goals are null."""
    response = self.client.get(MACROS_URL, {"date": str(self.date)})
    targets = response.json()["targets"]
    self.assertEqual(targets["calories"], 2000)
    self.assertEqual(targets["protein"], 120)
    self.assertEqual(targets["carbs"], 250)
    self.assertEqual(targets["fat"], 65)

  def test_handles_recipe_without_nutrition(self) -> None:
    """A recipe with no RecipeNutrition row contributes zero to totals."""
    bare_recipe = _make_recipe("No Nutrition Recipe", creator=self.user)
    MealPlanEntry.objects.create(
      user=self.user, date=self.date, meal_slot="breakfast", recipe=bare_recipe
    )
    response = self.client.get(MACROS_URL, {"date": str(self.date)})
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.json()["totals"]["calories"], "0.00")

  def test_missing_date_returns_400(self) -> None:
    response = self.client.get(MACROS_URL)
    self.assertEqual(response.status_code, 400)

  def test_malformed_date_returns_400(self) -> None:
    response = self.client.get(MACROS_URL, {"date": "bad"})
    self.assertEqual(response.status_code, 400)

  def test_unauthenticated_returns_401(self) -> None:
    anon = APIClient()
    response = anon.get(MACROS_URL, {"date": str(self.date)})
    self.assertEqual(response.status_code, 401)


class MealPlanEntryCreateViewTestCase(TestCase):
  """Tests for POST /api/meal-plan/entry/."""

  def setUp(self) -> None:
    self.user = _make_user("createuser")
    self.recipe = _make_recipe("Tacos", creator=self.user)
    self.client = APIClient()
    self.client.force_authenticate(user=self.user)
    self.date = "2026-04-07"

  def test_create_entry_returns_201(self) -> None:
    payload = {"date": self.date, "meal_slot": "dinner", "recipe_id": self.recipe.pk}
    response = self.client.post(ENTRY_URL, payload, format="json")
    self.assertEqual(response.status_code, 201)
    data = response.json()
    self.assertEqual(data["meal_slot"], "dinner")
    self.assertEqual(data["recipe"]["name"], "Tacos")

  def test_create_entry_is_scoped_to_requesting_user(self) -> None:
    """Entry is created for the authenticated user, not a different one."""
    payload = {"date": self.date, "meal_slot": "breakfast", "recipe_id": self.recipe.pk}
    self.client.post(ENTRY_URL, payload, format="json")
    self.assertTrue(
      MealPlanEntry.objects.filter(user=self.user, meal_slot="breakfast").exists()
    )

  def test_upsert_replaces_existing_slot(self) -> None:
    """POSTing to an occupied slot replaces the entry and returns 200."""
    recipe2 = _make_recipe("New Breakfast", creator=self.user)
    payload1 = {"date": self.date, "meal_slot": "breakfast", "recipe_id": self.recipe.pk}
    payload2 = {"date": self.date, "meal_slot": "breakfast", "recipe_id": recipe2.pk}
    self.client.post(ENTRY_URL, payload1, format="json")
    response = self.client.post(ENTRY_URL, payload2, format="json")
    self.assertEqual(response.status_code, 200)
    # Only one entry should exist for this slot
    count = MealPlanEntry.objects.filter(
      user=self.user, date=self.date, meal_slot="breakfast"
    ).count()
    self.assertEqual(count, 1)
    self.assertEqual(response.json()["recipe"]["name"], "New Breakfast")

  def test_invalid_slot_returns_400(self) -> None:
    payload = {"date": self.date, "meal_slot": "brunch", "recipe_id": self.recipe.pk}
    response = self.client.post(ENTRY_URL, payload, format="json")
    self.assertEqual(response.status_code, 400)

  def test_nonexistent_recipe_returns_404(self) -> None:
    payload = {"date": self.date, "meal_slot": "lunch", "recipe_id": 999999}
    response = self.client.post(ENTRY_URL, payload, format="json")
    self.assertEqual(response.status_code, 404)

  def test_malformed_date_returns_400(self) -> None:
    payload = {"date": "not-a-date", "meal_slot": "lunch", "recipe_id": self.recipe.pk}
    response = self.client.post(ENTRY_URL, payload, format="json")
    self.assertEqual(response.status_code, 400)

  def test_unauthenticated_returns_401(self) -> None:
    anon = APIClient()
    payload = {"date": self.date, "meal_slot": "dinner", "recipe_id": self.recipe.pk}
    response = anon.post(ENTRY_URL, payload, format="json")
    self.assertEqual(response.status_code, 401)


class MealPlanEntryDeleteViewTestCase(TestCase):
  """Tests for DELETE /api/meal-plan/entry/<pk>/."""

  def setUp(self) -> None:
    self.user = _make_user("deleteuser")
    self.other_user = _make_user("otherdelete")
    self.recipe = _make_recipe("Pasta", creator=self.user)
    self.entry = MealPlanEntry.objects.create(
      user=self.user,
      date=datetime.date(2026, 4, 7),
      meal_slot="lunch",
      recipe=self.recipe,
    )
    self.client = APIClient()
    self.client.force_authenticate(user=self.user)

  def _url(self, pk: int) -> str:
    return f"{ENTRY_URL}{pk}/"

  def test_delete_own_entry_returns_204(self) -> None:
    response = self.client.delete(self._url(self.entry.pk))
    self.assertEqual(response.status_code, 204)
    self.assertFalse(MealPlanEntry.objects.filter(pk=self.entry.pk).exists())

  def test_delete_other_users_entry_returns_404(self) -> None:
    """A user cannot delete another user's entry."""
    other_entry = MealPlanEntry.objects.create(
      user=self.other_user,
      date=datetime.date(2026, 4, 7),
      meal_slot="dinner",
      recipe=self.recipe,
    )
    response = self.client.delete(self._url(other_entry.pk))
    self.assertEqual(response.status_code, 404)
    # Entry should still exist
    self.assertTrue(MealPlanEntry.objects.filter(pk=other_entry.pk).exists())

  def test_delete_nonexistent_entry_returns_404(self) -> None:
    response = self.client.delete(self._url(999999))
    self.assertEqual(response.status_code, 404)

  def test_unauthenticated_returns_401(self) -> None:
    anon = APIClient()
    response = anon.delete(self._url(self.entry.pk))
    self.assertEqual(response.status_code, 401)
