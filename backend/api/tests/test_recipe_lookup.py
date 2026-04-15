"""
Tests for GET /api/recipe-lookup/

Coverage:
  - Allergy exclusion (icontains on ingredient name — token must be substring of name)
  - Diet filter AND semantics from profile
  - No diet filter when profile.diet_type is None or {}
  - ?diets= override supersedes profile
  - ?diets= (empty string) disables filter despite profile having prefs
  - Override does NOT mutate profile.diet_type
  - Allergy filter enforced even when diet override is present
  - Same seed produces same order on two requests
  - Unauthenticated request returns 401
"""

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from ingredients.models import Ingredient
from profiles.models import UserProfile
from recipes.models import Recipe, RecipeIngredient, RecipeInstruction
from users.models import User


class RecipeLookupTestBase(APITestCase):
  """Shared fixture setup for all recipe-lookup tests."""

  URL = "/api/recipe-lookup/"

  def setUp(self) -> None:
    # Create user and profile
    self.user: User = User.objects.create_user(  # type: ignore[assignment]
      username="testlookup",
      email="lookup@test.com",
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

    # Ingredients
    self.peanut_butter: Ingredient = Ingredient.objects.create(
      name="Peanut Butter",
      calories_per_100g=588,
      protein_per_100g=25,
      carbs_per_100g=20,
      fat_per_100g=50,
      fiber_per_100g=6,
      sugar_per_100g=9,
      sodium_per_100g=400,
    )
    self.olive_oil: Ingredient = Ingredient.objects.create(
      name="Olive Oil",
      calories_per_100g=884,
      protein_per_100g=0,
      carbs_per_100g=0,
      fat_per_100g=100,
      fiber_per_100g=0,
      sugar_per_100g=0,
      sodium_per_100g=0,
    )
    self.chicken: Ingredient = Ingredient.objects.create(
      name="Chicken Breast",
      calories_per_100g=165,
      protein_per_100g=31,
      carbs_per_100g=0,
      fat_per_100g=3,
      fiber_per_100g=0,
      sugar_per_100g=0,
      sodium_per_100g=74,
    )

    # Vegan recipe — safe (no allergens, vegan tag)
    self.vegan_recipe: Recipe = Recipe.objects.create(
      name="Vegan Pasta",
      description="Simple vegan pasta.",
      cuisine_type="Italian",
      dietary_tags=["vegan", "vegetarian"],
      meal_type="Dinner",
      measure_type="grams",
      servings=2,
    )
    RecipeInstruction.objects.create(
      recipe=self.vegan_recipe, step_number=1, text="Cook pasta."
    )
    RecipeIngredient.objects.create(
      recipe=self.vegan_recipe,
      ingredient=self.olive_oil,
      quantity=30,
      unit="ml",
    )

    # Recipe with peanut butter — should be excluded when allergies=["Peanuts"]
    self.peanut_recipe: Recipe = Recipe.objects.create(
      name="Peanut Noodles",
      description="Noodles with peanut butter sauce.",
      cuisine_type="Asian",
      dietary_tags=["vegan"],
      meal_type="Lunch",
      measure_type="grams",
      servings=2,
    )
    RecipeInstruction.objects.create(
      recipe=self.peanut_recipe, step_number=1, text="Mix sauce."
    )
    RecipeIngredient.objects.create(
      recipe=self.peanut_recipe,
      ingredient=self.peanut_butter,
      quantity=50,
      unit="g",
    )

    # Non-vegan recipe (chicken) — excluded under vegan filter
    self.chicken_recipe: Recipe = Recipe.objects.create(
      name="Chicken Stir Fry",
      description="Quick chicken dish.",
      cuisine_type="Asian",
      dietary_tags=["dairy_free"],
      meal_type="Dinner",
      measure_type="grams",
      servings=2,
    )
    RecipeInstruction.objects.create(
      recipe=self.chicken_recipe, step_number=1, text="Stir fry chicken."
    )
    RecipeIngredient.objects.create(
      recipe=self.chicken_recipe,
      ingredient=self.chicken,
      quantity=200,
      unit="g",
    )

  def _seed_url(self, seed: str = "test-seed-abc123", **extra_params: str) -> str:
    """Build URL with mandatory seed param plus any extras."""
    params = f"seed={seed}"
    for k, v in extra_params.items():
      params += f"&{k}={v}"
    return f"{self.URL}?{params}"

  def _get_ids(self, response) -> list[int]:  # type: ignore[no-untyped-def]
    return [r["id"] for r in response.data["results"]]


class TestAllergyExclusion(RecipeLookupTestBase):

  def test_recipe_with_allergen_ingredient_excluded(self) -> None:
    """F1: ingredient icontains match on allergy token excludes recipe.
    Token 'Peanut' is a case-insensitive substring of 'Peanut Butter'.
    """
    self.profile.allergies = ["Peanut"]
    self.profile.save()

    response = self.client.get(self._seed_url())
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertNotIn(self.peanut_recipe.id, ids)

  def test_non_allergen_recipe_still_returned(self) -> None:
    """Recipes without allergen ingredients are not filtered out."""
    self.profile.allergies = ["Peanuts"]
    self.profile.save()

    response = self.client.get(self._seed_url())
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertIn(self.vegan_recipe.id, ids)

  def test_allergy_filter_enforced_with_diet_override(self) -> None:
    """Allergy exclusion applies even when a diet override is present."""
    self.profile.allergies = ["Peanut"]
    self.profile.save()

    url = f"{self.URL}?seed=abc&diets=vegan"
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertNotIn(self.peanut_recipe.id, ids)


class TestDietFilter(RecipeLookupTestBase):

  def test_profile_diet_vegan_excludes_non_vegan(self) -> None:
    """F2: recipes missing the vegan tag excluded when profile diet_type={vegan:true}."""
    self.profile.diet_type = {"vegan": True}
    self.profile.save()

    response = self.client.get(self._seed_url())
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertNotIn(self.chicken_recipe.id, ids)

  def test_profile_diet_vegan_returns_vegan_recipe(self) -> None:
    """Vegan recipe is returned under vegan diet filter."""
    self.profile.diet_type = {"vegan": True}
    self.profile.save()

    response = self.client.get(self._seed_url())
    ids = self._get_ids(response)
    self.assertIn(self.vegan_recipe.id, ids)

  def test_no_diet_filter_when_diet_type_none(self) -> None:
    """All recipes returned when profile.diet_type is None."""
    self.profile.diet_type = None
    self.profile.save()

    response = self.client.get(self._seed_url())
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    # Both vegan and non-vegan recipes are returned
    self.assertIn(self.vegan_recipe.id, ids)
    self.assertIn(self.chicken_recipe.id, ids)

  def test_no_diet_filter_when_diet_type_empty_dict(self) -> None:
    """All recipes returned when profile.diet_type is {}."""
    self.profile.diet_type = {}
    self.profile.save()

    response = self.client.get(self._seed_url())
    ids = self._get_ids(response)
    self.assertIn(self.vegan_recipe.id, ids)
    self.assertIn(self.chicken_recipe.id, ids)


class TestDietOverride(RecipeLookupTestBase):

  def test_diets_override_supersedes_profile(self) -> None:
    """?diets=vegan works even when profile only has dairy_free."""
    self.profile.diet_type = {"dairy_free": True}
    self.profile.save()

    url = f"{self.URL}?seed=abc&diets=vegan"
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    # chicken_recipe has dairy_free tag but not vegan; should be excluded
    self.assertNotIn(self.chicken_recipe.id, ids)
    # vegan_recipe has vegan tag; should be included
    self.assertIn(self.vegan_recipe.id, ids)

  def test_empty_diets_param_disables_filter(self) -> None:
    """?diets= (empty) disables diet filtering despite profile having prefs."""
    self.profile.diet_type = {"vegan": True}
    self.profile.save()

    # Empty diets value: signals 'no filter'
    url = f"{self.URL}?seed=abc&diets="
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    # chicken_recipe (non-vegan) should appear since no filter is active
    self.assertIn(self.chicken_recipe.id, ids)

  def test_override_does_not_mutate_profile_diet_type(self) -> None:
    """F2b: sending ?diets=vegan must not write to profile.diet_type."""
    original_diet_type = {"dairy_free": True}
    self.profile.diet_type = original_diet_type.copy()
    self.profile.save()

    self.client.get(f"{self.URL}?seed=abc&diets=vegan")

    self.profile.refresh_from_db()
    self.assertEqual(self.profile.diet_type, original_diet_type)


class TestSeededOrdering(RecipeLookupTestBase):

  def test_same_seed_same_order(self) -> None:
    """Same seed produces identical ordering on two separate requests."""
    seed = "stable-seed-xyz"
    url = f"{self.URL}?seed={seed}"

    r1 = self.client.get(url)
    r2 = self.client.get(url)

    self.assertEqual(r1.status_code, status.HTTP_200_OK)
    ids1 = self._get_ids(r1)
    ids2 = self._get_ids(r2)
    self.assertEqual(ids1, ids2)


class TestAuthentication(RecipeLookupTestBase):

  def test_unauthenticated_returns_401(self) -> None:
    """F8: endpoint must reject unauthenticated requests."""
    self.client.credentials()  # remove auth token
    response = self.client.get(self._seed_url())
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestSeedRequired(RecipeLookupTestBase):

  def test_missing_seed_returns_400(self) -> None:
    """seed query param is required; omitting it returns 400."""
    response = self.client.get(self.URL)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_empty_seed_returns_400(self) -> None:
    """seed= (empty string) is treated as missing."""
    response = self.client.get(f"{self.URL}?seed=")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
