"""
Integration tests that verify the recipe lookup filter works correctly against
production-shaped dietary tag data (post-migration canonical keys only).

These tests reproduce the exact bug scenario: a user with dietary preferences set
should see recipes whose dietary_tags array contains the canonical lowercase keys
(e.g. "vegetarian", "keto") — not the legacy malformed strings like "Vegetarian, Lunch".

Coverage:
  - vegetarian-only profile sees only vegetarian-tagged recipes
  - vegan+vegetarian profile (AND semantics) sees only recipes tagged with both
  - ?diets=keto override returns only keto-tagged recipes regardless of profile
  - recipe with dietary_tags=[] appears in unfiltered feed but not under any diet filter
  - ?diets= (empty string override) returns all recipes despite active profile prefs
"""
from __future__ import annotations

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from ingredients.models import Ingredient
from profiles.models import UserProfile
from recipes.models import Recipe, RecipeIngredient, RecipeInstruction
from users.models import User


class ProductionShapeFilterBase(APITestCase):
  """
  Shared fixture: creates four recipes with canonical dietary_tags and one
  with no dietary tags, mirroring what the 0014 migration produces in production.
  """

  URL: str = "/api/recipe-lookup/"

  def setUp(self) -> None:
    self.user: User = User.objects.create_user(  # type: ignore[assignment]
      username="prod_shape_tester",
      email="prodshape@test.com",
      password="testpass123",
    )
    self.profile: UserProfile = UserProfile.objects.create(
      user=self.user,
      daily_calorie_goal=2000,
      diet_type=None,
      allergies=[],
    )
    token, _ = Token.objects.get_or_create(user=self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    # A minimal ingredient is needed for RecipeInstruction/RecipeIngredient constraints
    self.oil: Ingredient = Ingredient.objects.create(
      name="Canola Oil",
      calories_per_100g=884,
      protein_per_100g=0,
      carbs_per_100g=0,
      fat_per_100g=100,
      fiber_per_100g=0,
      sugar_per_100g=0,
      sodium_per_100g=0,
    )

    # vegetarian only
    self.veg_recipe: Recipe = self._make_recipe("Veggie Soup", ["vegetarian"])

    # vegetarian + vegan (AND both)
    self.vegan_veg_recipe: Recipe = self._make_recipe("Lentil Bowl", ["vegetarian", "vegan"])

    # keto only
    self.keto_recipe: Recipe = self._make_recipe("Creamy Chicken Broccoli", ["keto"])

    # no dietary tags — appears only in unfiltered results
    self.plain_recipe: Recipe = self._make_recipe("Beef Stirfry", [])

  def _make_recipe(self, name: str, tags: list[str]) -> Recipe:
    """Create a minimal valid recipe with the given canonical dietary tags."""
    recipe: Recipe = Recipe.objects.create(  # type: ignore[assignment]
      name=name,
      description="",
      cuisine_type="International",
      dietary_tags=tags,
      meal_type="Dinner",
      measure_type="grams",
      servings=2,
    )
    RecipeInstruction.objects.create(recipe=recipe, step_number=1, text="Cook.")
    RecipeIngredient.objects.create(recipe=recipe, ingredient=self.oil, quantity=10, unit="ml")
    return recipe

  def _url(self, seed: str = "test-seed", **params: str) -> str:
    """Build the lookup URL with a mandatory seed and optional extra query params."""
    parts: list[str] = [f"seed={seed}"]
    for k, v in params.items():
      parts.append(f"{k}={v}")
    return f"{self.URL}?{'&'.join(parts)}"

  def _ids(self, response) -> list[int]:  # type: ignore[no-untyped-def]
    return [r["id"] for r in response.data["results"]]


class TestVegetarianProfileFilter(ProductionShapeFilterBase):
  """User with vegetarian=True should see only recipes tagged 'vegetarian'."""

  def setUp(self) -> None:
    super().setUp()
    self.profile.diet_type = {"vegetarian": True}
    self.profile.save()

  def test_vegetarian_recipe_returned(self) -> None:
    response = self.client.get(self._url())
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids: list[int] = self._ids(response)
    self.assertIn(self.veg_recipe.id, ids)

  def test_vegan_vegetarian_recipe_returned(self) -> None:
    """Recipe tagged [vegetarian, vegan] satisfies the vegetarian-only filter."""
    response = self.client.get(self._url())
    ids: list[int] = self._ids(response)
    self.assertIn(self.vegan_veg_recipe.id, ids)

  def test_keto_only_recipe_excluded(self) -> None:
    response = self.client.get(self._url())
    ids: list[int] = self._ids(response)
    self.assertNotIn(self.keto_recipe.id, ids)

  def test_plain_recipe_excluded(self) -> None:
    """Recipe with dietary_tags=[] must be excluded when any diet pref is active."""
    response = self.client.get(self._url())
    ids: list[int] = self._ids(response)
    self.assertNotIn(self.plain_recipe.id, ids)


class TestVeganAndVegetarianProfileFilter(ProductionShapeFilterBase):
  """User with vegan=True AND vegetarian=True must see only recipes tagged with both."""

  def setUp(self) -> None:
    super().setUp()
    self.profile.diet_type = {"vegan": True, "vegetarian": True}
    self.profile.save()

  def test_vegan_vegetarian_recipe_returned(self) -> None:
    response = self.client.get(self._url())
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids: list[int] = self._ids(response)
    self.assertIn(self.vegan_veg_recipe.id, ids)

  def test_vegetarian_only_recipe_excluded(self) -> None:
    """A recipe tagged only [vegetarian] fails the AND check for vegan."""
    response = self.client.get(self._url())
    ids: list[int] = self._ids(response)
    self.assertNotIn(self.veg_recipe.id, ids)

  def test_keto_recipe_excluded(self) -> None:
    response = self.client.get(self._url())
    ids: list[int] = self._ids(response)
    self.assertNotIn(self.keto_recipe.id, ids)

  def test_plain_recipe_excluded(self) -> None:
    response = self.client.get(self._url())
    ids: list[int] = self._ids(response)
    self.assertNotIn(self.plain_recipe.id, ids)


class TestDietOverrideQueryParam(ProductionShapeFilterBase):
  """?diets= query param overrides profile preferences."""

  def setUp(self) -> None:
    super().setUp()
    # Profile has vegetarian pref — override should supersede it
    self.profile.diet_type = {"vegetarian": True}
    self.profile.save()

  def test_keto_override_returns_only_keto_recipes(self) -> None:
    response = self.client.get(self._url(diets="keto"))
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids: list[int] = self._ids(response)
    self.assertIn(self.keto_recipe.id, ids)
    self.assertNotIn(self.veg_recipe.id, ids)
    self.assertNotIn(self.vegan_veg_recipe.id, ids)
    self.assertNotIn(self.plain_recipe.id, ids)

  def test_empty_diets_override_returns_all_recipes(self) -> None:
    """?diets= (empty string) disables all diet filtering — all recipes returned."""
    response = self.client.get(self._url(diets=""))
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids: list[int] = self._ids(response)
    # All four fixture recipes should appear in the unfiltered result
    self.assertIn(self.veg_recipe.id, ids)
    self.assertIn(self.vegan_veg_recipe.id, ids)
    self.assertIn(self.keto_recipe.id, ids)
    self.assertIn(self.plain_recipe.id, ids)


class TestUnfilteredFeed(ProductionShapeFilterBase):
  """With diet_type=None or {}, all recipes are returned regardless of their tags."""

  def test_no_diet_prefs_returns_all_recipes(self) -> None:
    """diet_type=None means no filter — recipe with dietary_tags=[] must appear."""
    self.profile.diet_type = None
    self.profile.save()

    response = self.client.get(self._url())
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids: list[int] = self._ids(response)
    self.assertIn(self.plain_recipe.id, ids)
    self.assertIn(self.veg_recipe.id, ids)
    self.assertIn(self.keto_recipe.id, ids)

  def test_empty_dict_diet_type_returns_all_recipes(self) -> None:
    """diet_type={} (cleared prefs) also means no filter."""
    self.profile.diet_type = {}
    self.profile.save()

    response = self.client.get(self._url())
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids: list[int] = self._ids(response)
    self.assertIn(self.plain_recipe.id, ids)
    self.assertIn(self.veg_recipe.id, ids)
    self.assertIn(self.keto_recipe.id, ids)
