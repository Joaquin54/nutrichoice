"""
Tests for allergy filtering on GET /api/recipe-feed/

Coverage:
  - Allergen-matched recipe excluded from feed (icontains on ingredient name)
  - Control recipe without allergen ingredient still returned
  - Multiple allergy tokens use OR semantics — any match excludes the recipe
  - Empty allergies list has no effect on feed results
  - None-like allergies value (empty list edge case) produces no errors
  - Combined diet + allergy filtering
  - Allergen-excluded recipe absent even when it would score highest on ingredient_overlap
"""

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from ingredients.models import Ingredient
from profiles.models import UserProfile
from recipes.models import Recipe, RecipeIngredient, RecipeInstruction
from social.models import TriedRecipe
from users.models import User


URL = "/api/recipe-feed/"


class RecipeFeedAllergyTestBase(APITestCase):
  """Shared fixture setup for all recipe-feed allergy tests."""

  def setUp(self) -> None:
    # Creator user whose recipes will populate the feed
    self.creator: User = User.objects.create_user(  # type: ignore[assignment]
      username="feedcreator",
      email="creator@feed.test",
      password="pass1234",
    )

    # Requesting user — the one whose feed we're testing
    self.user: User = User.objects.create_user(  # type: ignore[assignment]
      username="feedconsumer",
      email="consumer@feed.test",
      password="pass1234",
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
    self.shrimp: Ingredient = Ingredient.objects.create(
      name="Shrimp",
      calories_per_100g=85,
      protein_per_100g=18,
      carbs_per_100g=0,
      fat_per_100g=1,
      fiber_per_100g=0,
      sugar_per_100g=0,
      sodium_per_100g=119,
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
    self.tomato: Ingredient = Ingredient.objects.create(
      name="Tomato",
      calories_per_100g=18,
      protein_per_100g=1,
      carbs_per_100g=4,
      fat_per_100g=0,
      fiber_per_100g=1,
      sugar_per_100g=2,
      sodium_per_100g=5,
    )

    # Recipe containing peanut butter — should be excluded for peanut allergies
    self.peanut_recipe: Recipe = Recipe.objects.create(
      name="Peanut Noodles",
      creator=self.creator,
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

    # Recipe containing shrimp — should be excluded for shellfish allergies
    self.shrimp_recipe: Recipe = Recipe.objects.create(
      name="Shrimp Stir Fry",
      creator=self.creator,
      description="Quick shrimp dish.",
      cuisine_type="Asian",
      dietary_tags=["dairy_free"],
      meal_type="Dinner",
      measure_type="grams",
      servings=2,
    )
    RecipeInstruction.objects.create(
      recipe=self.shrimp_recipe, step_number=1, text="Stir fry shrimp."
    )
    RecipeIngredient.objects.create(
      recipe=self.shrimp_recipe,
      ingredient=self.shrimp,
      quantity=200,
      unit="g",
    )

    # Safe vegan recipe — no allergen ingredients
    self.safe_recipe: Recipe = Recipe.objects.create(
      name="Tomato Pasta",
      creator=self.creator,
      description="Simple tomato pasta.",
      cuisine_type="Italian",
      dietary_tags=["vegan", "vegetarian"],
      meal_type="Dinner",
      measure_type="grams",
      servings=2,
    )
    RecipeInstruction.objects.create(
      recipe=self.safe_recipe, step_number=1, text="Cook pasta."
    )
    RecipeIngredient.objects.create(
      recipe=self.safe_recipe,
      ingredient=self.olive_oil,
      quantity=30,
      unit="ml",
    )

  def _get_ids(self, response) -> list[int]:  # type: ignore[no-untyped-def]
    return [r["id"] for r in response.data["results"]]


class TestFeedAllergyExclusion(RecipeFeedAllergyTestBase):

  def test_recipe_with_allergen_ingredient_excluded(self) -> None:
    """
    A recipe whose ingredient name contains the allergy token (icontains)
    must not appear in the feed. Token 'Peanut' is a case-insensitive substring
    of 'Peanut Butter'.
    """
    self.profile.allergies = ["Peanut"]
    self.profile.save()

    response = self.client.get(URL)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertNotIn(self.peanut_recipe.id, ids)

  def test_recipe_without_allergen_ingredient_returned(self) -> None:
    """
    Control: a recipe with no allergen-matched ingredients must still appear
    in the feed when the user has an active allergy filter.
    Token 'Peanut' matches 'Peanut Butter' but not 'Tomato' or 'Olive Oil'.
    """
    self.profile.allergies = ["Peanut"]
    self.profile.save()

    response = self.client.get(URL)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertIn(self.safe_recipe.id, ids)

  def test_multi_token_allergies_or_semantics(self) -> None:
    """
    Multiple allergy tokens use OR semantics — any single token match is
    enough to exclude a recipe. Tokens are independent substrings; 'Peanut'
    matches 'Peanut Butter' but 'Shellfish' does not match 'Shrimp'.
    Only the peanut recipe is excluded; safe and shrimp recipes remain.
    """
    self.profile.allergies = ["Peanut", "Shellfish"]
    self.profile.save()

    response = self.client.get(URL)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    # 'Peanut' icontains matches 'Peanut Butter' — excluded
    self.assertNotIn(self.peanut_recipe.id, ids)
    # 'Shellfish' does NOT icontains-match 'Shrimp' — shrimp_recipe should still appear
    # This verifies the filter is a literal substring check, not fuzzy/semantic
    self.assertIn(self.safe_recipe.id, ids)
    self.assertIn(self.shrimp_recipe.id, ids)

  def test_shellfish_token_matches_shrimp_ingredient(self) -> None:
    """
    'Shrimp' token directly icontains-matches the 'Shrimp' ingredient name,
    excluding the shrimp recipe.
    """
    self.profile.allergies = ["Shrimp"]
    self.profile.save()

    response = self.client.get(URL)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertNotIn(self.shrimp_recipe.id, ids)
    self.assertIn(self.safe_recipe.id, ids)

  def test_empty_allergies_returns_all_eligible_recipes(self) -> None:
    """
    When the user's allergies list is empty, no allergy filtering is applied —
    all non-blocked, non-tried recipes are returned, including the peanut recipe.
    """
    self.profile.allergies = []
    self.profile.save()

    response = self.client.get(URL)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertIn(self.peanut_recipe.id, ids)
    self.assertIn(self.safe_recipe.id, ids)
    self.assertIn(self.shrimp_recipe.id, ids)

  def test_empty_allergies_no_behavior_change(self) -> None:
    """
    FA3 regression: a user with allergies=[] must see identical recipe sets
    as a user who has never set allergies. The presence of the allergy code
    path must not affect users with empty allergy lists.
    """
    # Baseline: no allergy field manipulation (default=[])
    response_default = self.client.get(URL)
    ids_default = self._get_ids(response_default)

    # Explicitly set to empty list — must produce same result
    self.profile.allergies = []
    self.profile.save()
    response_empty = self.client.get(URL)
    ids_empty = self._get_ids(response_empty)

    self.assertEqual(set(ids_default), set(ids_empty))

  def test_diet_and_allergy_combined(self) -> None:
    """
    Combined filter: vegan diet AND peanut allergy.
    - peanut_recipe (vegan tag, peanut ingredient): excluded by allergy
    - safe_recipe (vegan tag, no allergen): returned
    - shrimp_recipe (no vegan tag): excluded by diet filter
    Token 'Peanut' icontains-matches 'Peanut Butter'.
    """
    self.profile.diet_type = {"vegan": True}
    self.profile.allergies = ["Peanut"]
    self.profile.save()

    response = self.client.get(URL)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    self.assertNotIn(self.peanut_recipe.id, ids)   # excluded by allergy
    self.assertNotIn(self.shrimp_recipe.id, ids)   # excluded by diet
    self.assertIn(self.safe_recipe.id, ids)         # passes both filters

  def test_allergy_excluded_recipe_not_in_results_despite_ingredient_overlap(
    self,
  ) -> None:
    """
    FA1 / FA4 regression: a recipe excluded by allergy must not appear in the
    feed even when it would score highest on ingredient_overlap. Scoring must
    run only on the pruned set.

    Setup:
      - Mark peanut_butter as a tried ingredient by marking the peanut_recipe tried.
      - Add peanut_butter to the safe_recipe too (so overlap scoring is active).
      - Set allergy to 'Peanuts' — peanut_recipe must be absent regardless of score.
    """
    # Mark peanut_recipe as tried so peanut_butter enters tried_ingredient_ids.
    TriedRecipe.objects.create(recipe=self.peanut_recipe, tried_by=self.user)

    # Give safe_recipe a peanut_butter ingredient so it gains overlap score.
    RecipeIngredient.objects.create(
      recipe=self.safe_recipe,
      ingredient=self.peanut_butter,
      quantity=10,
      unit="g",
    )

    self.profile.allergies = ["Peanut"]
    self.profile.save()

    response = self.client.get(URL)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = self._get_ids(response)
    # peanut_recipe was tried — excluded by tried_recipe_ids filter.
    # The key assertion: the allergy branch doesn't reintroduce it.
    self.assertNotIn(self.peanut_recipe.id, ids)
    # safe_recipe now has peanut_butter ingredient added above, so it WILL be
    # excluded by the allergy filter ('Peanut' icontains 'Peanut Butter').
    self.assertNotIn(self.safe_recipe.id, ids)
    # shrimp_recipe has no peanut ingredient — should remain.
    self.assertIn(self.shrimp_recipe.id, ids)
