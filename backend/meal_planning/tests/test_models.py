import datetime

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from meal_planning.models import MealPlanEntry
from recipes.models import Recipe

User = get_user_model()


def _make_user(username: str, **kwargs) -> object:
  """Create a user with a unique email to satisfy the users.email unique constraint."""
  kwargs.setdefault("email", f"{username}@test.com")
  return User.objects.create_user(
    username=username,
    password="testpass123",
    **kwargs,
  )


def _make_recipe(name: str, creator=None) -> Recipe:
  """Create a recipe with sensible defaults."""
  return Recipe.objects.create(
    name=name,
    description="A test recipe.",
    cuisine_type="Test",
    dietary_tags=[],
    creator=creator,
  )


class MealPlanEntryModelTestCase(TestCase):
  """Tests for the MealPlanEntry model constraints and cascade behaviour."""

  def setUp(self) -> None:
    self.user = _make_user("planuser")
    self.recipe = _make_recipe("Test Oats", creator=self.user)
    self.date = datetime.date(2026, 4, 7)

  def test_create_entry(self) -> None:
    """Basic creation succeeds with valid data."""
    entry = MealPlanEntry.objects.create(
      user=self.user,
      date=self.date,
      meal_slot=MealPlanEntry.MealSlot.BREAKFAST,
      recipe=self.recipe,
    )
    self.assertEqual(entry.meal_slot, "breakfast")
    self.assertEqual(entry.date, self.date)

  def test_unique_constraint_raises_integrity_error(self) -> None:
    """Duplicate (user, date, meal_slot) raises IntegrityError."""
    MealPlanEntry.objects.create(
      user=self.user,
      date=self.date,
      meal_slot=MealPlanEntry.MealSlot.LUNCH,
      recipe=self.recipe,
    )
    recipe2 = _make_recipe("Test Salad", creator=self.user)
    with self.assertRaises(IntegrityError):
      MealPlanEntry.objects.create(
        user=self.user,
        date=self.date,
        meal_slot=MealPlanEntry.MealSlot.LUNCH,
        recipe=recipe2,
      )

  def test_same_slot_different_dates_allowed(self) -> None:
    """Same slot on different dates does not violate the constraint."""
    MealPlanEntry.objects.create(
      user=self.user,
      date=self.date,
      meal_slot=MealPlanEntry.MealSlot.DINNER,
      recipe=self.recipe,
    )
    MealPlanEntry.objects.create(
      user=self.user,
      date=self.date + datetime.timedelta(days=1),
      meal_slot=MealPlanEntry.MealSlot.DINNER,
      recipe=self.recipe,
    )
    self.assertEqual(MealPlanEntry.objects.filter(user=self.user).count(), 2)

  def test_cascade_on_recipe_delete(self) -> None:
    """Deleting a recipe cascades to its meal plan entries."""
    MealPlanEntry.objects.create(
      user=self.user,
      date=self.date,
      meal_slot=MealPlanEntry.MealSlot.SNACK1,
      recipe=self.recipe,
    )
    self.recipe.delete()
    self.assertEqual(MealPlanEntry.objects.filter(user=self.user).count(), 0)

  def test_cascade_on_user_delete(self) -> None:
    """Deleting a user cascades to their meal plan entries."""
    other_user = _make_user("otherplan")
    MealPlanEntry.objects.create(
      user=other_user,
      date=self.date,
      meal_slot=MealPlanEntry.MealSlot.BREAKFAST,
      recipe=self.recipe,
    )
    other_user.delete()
    self.assertEqual(MealPlanEntry.objects.filter(date=self.date).count(), 0)

  def test_meal_slot_choices(self) -> None:
    """All five MealSlot choices are defined with correct values."""
    values = {s.value for s in MealPlanEntry.MealSlot}
    self.assertEqual(values, {"breakfast", "snack1", "lunch", "snack2", "dinner"})
