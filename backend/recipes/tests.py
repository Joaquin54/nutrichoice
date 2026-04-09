"""
Tests for recipe-ingredient associations.

Verifies that:
- RecipeIngredient records are correctly linked to recipes and ingredients.
- The API returns full ingredient payloads for each recipe.
- A CSV source file can be fully ingested and every association round-trips.
"""

import csv
from decimal import Decimal
from pathlib import Path
from typing import Any

from django.contrib.auth import get_user_model
from django.db.models import Count, QuerySet
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from ingredients.models import Ingredient
from nutrition.models import RecipeNutrition
from nutrition.services import compute_and_store_nutrition
from recipes.models import Recipe, RecipeIngredient

User = get_user_model()

CSV_PATH = Path.home() / "Downloads" / "recipes-list.csv"


def _parse_csv_ingredients(row: dict[str, str]) -> list[dict[str, Any]]:
  """Parse a CSV row's ingredient column into a list of {name, quantity} dicts."""
  entries: list[dict[str, Any]] = []
  for part in row["Ingredients (amounts in g)"].split(";"):
    part = part.strip()
    if not part or " - " not in part:
      continue
    name, amount_str = part.split(" - ", 1)
    quantity = float(amount_str.strip().rstrip("g").strip())
    entries.append({"name": name.strip(), "quantity": quantity})
  return entries


# ---------------------------------------------------------------------------
# 1. API tests — self-contained with their own fixtures
# ---------------------------------------------------------------------------


class RecipeIngredientAPITestCase(TestCase):
  """Test the GET /api/recipes/<pk>/ endpoint returns full ingredients."""

  @classmethod
  def setUpTestData(cls) -> None:
    cls.user = User.objects.create_user(
      username="testuser", password="testpass123"
    )
    cls.ingredient_a = Ingredient.objects.create(
      name="TestFlour",
      calories_per_100g=364, protein_per_100g=10,
      carbs_per_100g=76, fat_per_100g=1,
      fiber_per_100g=3, sugar_per_100g=1, sodium_per_100g=2,
    )
    cls.ingredient_b = Ingredient.objects.create(
      name="TestSugar",
      calories_per_100g=387, protein_per_100g=0,
      carbs_per_100g=100, fat_per_100g=0,
      fiber_per_100g=0, sugar_per_100g=100, sodium_per_100g=1,
    )
    cls.recipe = Recipe.objects.create(
      name="TestCake",
      description="A test cake recipe",
      cuisine_type="Dessert",
      dietary_tags=["Vegetarian"],
      creator=cls.user,
    )
    RecipeIngredient.objects.create(
      recipe=cls.recipe, ingredient=cls.ingredient_a,
      quantity=200, unit="g",
    )
    RecipeIngredient.objects.create(
      recipe=cls.recipe, ingredient=cls.ingredient_b,
      quantity=50, unit="g",
    )

  def setUp(self) -> None:
    self.client = APIClient()
    self.client.force_authenticate(user=self.user)

  def test_detail_returns_ingredients(self) -> None:
    """GET /api/recipes/<pk>/ should include an ingredients array."""
    response = self.client.get(f"/api/recipes/{self.recipe.pk}/")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    data = response.json()
    self.assertIn("ingredients", data)
    self.assertEqual(len(data["ingredients"]), 2)

  def test_ingredient_payload_shape(self) -> None:
    """Each ingredient entry should contain nested ingredient data, quantity, and unit."""
    response = self.client.get(f"/api/recipes/{self.recipe.pk}/")
    data = response.json()
    ingredient_entry = data["ingredients"][0]

    self.assertIn("ingredient", ingredient_entry)
    self.assertIn("quantity", ingredient_entry)
    self.assertIn("unit", ingredient_entry)

    nested = ingredient_entry["ingredient"]
    expected_fields = {
      "id", "name", "calories_per_100g", "protein_per_100g",
      "carbs_per_100g", "fat_per_100g", "fiber_per_100g",
      "sugar_per_100g", "sodium_per_100g", "default_unit",
    }
    self.assertTrue(
      expected_fields.issubset(nested.keys()),
      f"Missing fields: {expected_fields - nested.keys()}",
    )

  def test_ingredient_names_in_response(self) -> None:
    """The ingredient names in the response should match what was created."""
    response = self.client.get(f"/api/recipes/{self.recipe.pk}/")
    data = response.json()
    returned_names = {
      entry["ingredient"]["name"] for entry in data["ingredients"]
    }
    self.assertEqual(returned_names, {"TestFlour", "TestSugar"})

  def test_ingredient_quantities_in_response(self) -> None:
    """The quantities returned should match the RecipeIngredient records."""
    response = self.client.get(f"/api/recipes/{self.recipe.pk}/")
    data = response.json()
    qty_by_name = {
      entry["ingredient"]["name"]: entry["quantity"]
      for entry in data["ingredients"]
    }
    self.assertEqual(qty_by_name["TestFlour"], 200.0)
    self.assertEqual(qty_by_name["TestSugar"], 50.0)

  def test_unauthenticated_returns_401(self) -> None:
    """Unauthenticated requests should be rejected."""
    self.client.force_authenticate(user=None)
    response = self.client.get(f"/api/recipes/{self.recipe.pk}/")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_nonexistent_recipe_returns_404(self) -> None:
    """Requesting a non-existent recipe ID should return 404."""
    response = self.client.get("/api/recipes/99999/")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# 2. CSV round-trip tests — seeds the test DB from the CSV, then verifies
# ---------------------------------------------------------------------------


class RecipeIngredientCSVMatchTestCase(TestCase):
  """
  Seed the test DB from the recipes-list CSV, then verify every
  recipe-ingredient association round-trips correctly.

  Skipped automatically if the CSV file is not present (e.g. in CI).
  """

  @classmethod
  def setUpTestData(cls) -> None:
    if not CSV_PATH.exists():
      return

    with open(CSV_PATH, "r") as f:
      cls.csv_rows: dict[str, dict[str, str]] = {
        row["Recipe Name"].strip(): row for row in csv.DictReader(f)
      }

    # Collect every unique ingredient name from the CSV.
    all_ingredient_names: set[str] = set()
    for row in cls.csv_rows.values():
      for entry in _parse_csv_ingredients(row):
        all_ingredient_names.add(entry["name"])

    # Create Ingredient rows with placeholder nutritional data.
    cls.ingredients_by_name: dict[str, Ingredient] = {}
    for name in sorted(all_ingredient_names):
      cls.ingredients_by_name[name] = Ingredient.objects.create(
        name=name,
        calories_per_100g=100, protein_per_100g=10,
        carbs_per_100g=10, fat_per_100g=5,
        fiber_per_100g=2, sugar_per_100g=3, sodium_per_100g=1,
      )

    # Create a user to own the recipes.
    cls.user = User.objects.create_user(
      username="csv_test_user", password="testpass123"
    )

    # Create Recipe and RecipeIngredient rows.
    for recipe_name, row in cls.csv_rows.items():
      csv_tags = [t.strip() for t in row["Diet Type"].split(";")]
      recipe = Recipe.objects.create(
        name=recipe_name,
        description="",
        cuisine_type="",
        dietary_tags=csv_tags,
        creator=cls.user,
      )
      for entry in _parse_csv_ingredients(row):
        RecipeIngredient.objects.create(
          recipe=recipe,
          ingredient=cls.ingredients_by_name[entry["name"]],
          quantity=entry["quantity"],
          unit="g",
        )
      compute_and_store_nutrition(recipe=recipe)

  def setUp(self) -> None:
    if not CSV_PATH.exists():
      self.skipTest(f"CSV not found at {CSV_PATH}")

  # -- Recipe existence --

  def test_every_csv_recipe_exists_in_db(self) -> None:
    """All recipe names from the CSV must exist in the database."""
    db_names = set(Recipe.objects.values_list("name", flat=True))
    missing = set(self.csv_rows.keys()) - db_names
    self.assertEqual(
      len(missing), 0,
      f"CSV recipes missing from DB: {sorted(missing)}",
    )

  # -- Ingredient existence --

  def test_every_csv_ingredient_exists_in_db(self) -> None:
    """All ingredient names referenced in the CSV must exist in the DB."""
    db_names = set(Ingredient.objects.values_list("name", flat=True))
    csv_names: set[str] = set()
    for row in self.csv_rows.values():
      for entry in _parse_csv_ingredients(row):
        csv_names.add(entry["name"])

    missing = csv_names - db_names
    self.assertEqual(
      len(missing), 0,
      f"CSV ingredients missing from DB: {sorted(missing)}",
    )

  # -- Per-recipe association checks --

  def test_ingredient_count_matches_csv(self) -> None:
    """Each recipe should have the same number of ingredients as the CSV."""
    mismatches: list[str] = []
    for recipe_name, row in self.csv_rows.items():
      csv_count = len(_parse_csv_ingredients(row))
      db_count = RecipeIngredient.objects.filter(
        recipe__name=recipe_name
      ).count()
      if csv_count != db_count:
        mismatches.append(
          f"{recipe_name}: CSV={csv_count}, DB={db_count}"
        )
    self.assertEqual(
      len(mismatches), 0,
      f"Ingredient count mismatches:\n" + "\n".join(mismatches),
    )

  def test_ingredient_names_match_csv(self) -> None:
    """Each recipe's ingredient set must match the CSV exactly."""
    mismatches: list[str] = []
    for recipe_name, row in self.csv_rows.items():
      csv_names = {e["name"] for e in _parse_csv_ingredients(row)}
      db_names = set(
        RecipeIngredient.objects
        .filter(recipe__name=recipe_name)
        .values_list("ingredient__name", flat=True)
      )
      if csv_names != db_names:
        only_csv = csv_names - db_names
        only_db = db_names - csv_names
        detail = f"{recipe_name}:"
        if only_csv:
          detail += f" in CSV only={sorted(only_csv)}"
        if only_db:
          detail += f" in DB only={sorted(only_db)}"
        mismatches.append(detail)
    self.assertEqual(
      len(mismatches), 0,
      f"Ingredient name mismatches:\n" + "\n".join(mismatches),
    )

  def test_ingredient_quantities_match_csv(self) -> None:
    """Each recipe's ingredient quantities must match the CSV."""
    mismatches: list[str] = []
    for recipe_name, row in self.csv_rows.items():
      csv_lookup = {
        e["name"]: e["quantity"] for e in _parse_csv_ingredients(row)
      }
      db_entries = (
        RecipeIngredient.objects
        .filter(recipe__name=recipe_name)
        .select_related("ingredient")
      )
      for ri in db_entries:
        csv_qty = csv_lookup.get(ri.ingredient.name)
        if csv_qty is not None and abs(ri.quantity - csv_qty) > 0.01:
          mismatches.append(
            f"{recipe_name}/{ri.ingredient.name}: "
            f"CSV={csv_qty}, DB={ri.quantity}"
          )
    self.assertEqual(
      len(mismatches), 0,
      f"Quantity mismatches:\n" + "\n".join(mismatches),
    )

  def test_dietary_tags_match_csv(self) -> None:
    """Each recipe's dietary_tags should match the corrected CSV values."""
    mismatches: list[str] = []
    for recipe_name, row in self.csv_rows.items():
      csv_tags = [t.strip() for t in row["Diet Type"].split(";")]
      try:
        recipe = Recipe.objects.get(name=recipe_name)
      except Recipe.DoesNotExist:
        continue
      if recipe.dietary_tags != csv_tags:
        mismatches.append(
          f"{recipe_name}: CSV={csv_tags}, DB={recipe.dietary_tags}"
        )
    self.assertEqual(
      len(mismatches), 0,
      f"Dietary tag mismatches:\n" + "\n".join(mismatches),
    )

  # -- Integrity checks on the seeded data --

  def test_all_recipes_have_at_least_one_ingredient(self) -> None:
    """No recipe should be an empty shell with zero ingredients."""
    empty: QuerySet[Recipe] = (
      Recipe.objects
      .annotate(ingredient_count=Count("ingredients"))
      .filter(ingredient_count=0)
    )
    self.assertEqual(
      empty.count(), 0,
      f"Recipes without ingredients: "
      f"{list(empty.values_list('name', flat=True))}",
    )

  def test_all_recipes_have_nutrition(self) -> None:
    """Every recipe should have a computed RecipeNutrition record."""
    without_nutrition: QuerySet[Recipe] = Recipe.objects.exclude(
      pk__in=RecipeNutrition.objects.values_list("recipe_id", flat=True)
    )
    self.assertEqual(
      without_nutrition.count(), 0,
      f"Recipes without nutrition: "
      f"{list(without_nutrition.values_list('name', flat=True))}",
    )

  def test_no_orphaned_recipe_ingredients(self) -> None:
    """Every RecipeIngredient must point to an existing Ingredient row."""
    orphaned = RecipeIngredient.objects.exclude(
      ingredient_id__in=Ingredient.objects.values_list("id", flat=True)
    )
    self.assertEqual(orphaned.count(), 0)

  def test_all_quantities_are_positive(self) -> None:
    """No ingredient should have a zero or negative quantity."""
    bad_rows = RecipeIngredient.objects.filter(quantity__lte=0)
    self.assertEqual(
      bad_rows.count(), 0,
      f"RecipeIngredient rows with non-positive quantity: {bad_rows.count()}",
    )

  def test_all_units_are_non_empty(self) -> None:
    """Every RecipeIngredient must have a unit value."""
    blank_units = RecipeIngredient.objects.filter(unit="")
    self.assertEqual(blank_units.count(), 0)

  def test_nutrition_values_are_non_negative(self) -> None:
    """All stored nutrition values should be >= 0."""
    nutrient_fields = [
      "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium",
    ]
    for field in nutrient_fields:
      bad = RecipeNutrition.objects.filter(**{f"{field}__lt": Decimal("0")})
      self.assertEqual(
        bad.count(), 0,
        f"RecipeNutrition has negative {field} for {bad.count()} recipes",
      )

  def test_recipe_count_matches_csv(self) -> None:
    """The number of recipes in the DB should match the CSV row count."""
    self.assertEqual(Recipe.objects.count(), len(self.csv_rows))


# ---------------------------------------------------------------------------
# RecipeFeedService — diet_type nullable behaviour
# ---------------------------------------------------------------------------

from profiles.models import UserProfile  # noqa: E402
from recipes.services.feed import RecipeFeedService  # noqa: E402


class RecipeFeedDietTypeTests(TestCase):
  """
  Tests for RecipeFeedService._get_active_diet_prefs and build_feed when
  diet_type is None or {}.
  """

  @classmethod
  def setUpTestData(cls) -> None:
    cls.user = User.objects.create_user(
      username='feedtest_user', password='testpass123'
    )
    cls.profile = UserProfile.objects.create(user=cls.user, diet_type=None)

    # A vegetarian recipe — has the 'vegetarian' tag
    cls.vegetarian_recipe = Recipe.objects.create(
      name='Veggie Salad',
      description='A fresh salad',
      cuisine_type='American',
      dietary_tags=['vegetarian'],
      creator=cls.user,
    )
    # A non-vegetarian recipe
    cls.regular_recipe = Recipe.objects.create(
      name='Beef Burger',
      description='A beef burger',
      cuisine_type='American',
      dietary_tags=['Regular'],
      creator=cls.user,
    )

  def _get_service(self) -> RecipeFeedService:
    return RecipeFeedService()

  def _reload_user(self) -> Any:
    """Return a fresh user instance with profile pre-fetched."""
    from django.contrib.auth import get_user_model
    User_ = get_user_model()
    return User_.objects.select_related('profile').get(pk=self.user.pk)

  def test_get_active_diet_prefs_returns_empty_for_none(self) -> None:
    """_get_active_diet_prefs returns [] when diet_type is None."""
    self.profile.diet_type = None
    self.profile.save(update_fields=['diet_type'])
    user = self._reload_user()
    result = self._get_service()._get_active_diet_prefs(user)
    self.assertEqual(result, [])

  def test_get_active_diet_prefs_returns_empty_for_empty_dict(self) -> None:
    """_get_active_diet_prefs returns [] when diet_type is {}."""
    self.profile.diet_type = {}
    self.profile.save(update_fields=['diet_type'])
    user = self._reload_user()
    result = self._get_service()._get_active_diet_prefs(user)
    self.assertEqual(result, [])

  def test_build_feed_with_null_diet_type_returns_unfiltered(self) -> None:
    """build_feed with diet_type=None applies no dietary filter — both recipes appear."""
    self.profile.diet_type = None
    self.profile.save(update_fields=['diet_type'])
    user = self._reload_user()
    qs = self._get_service().build_feed(user)
    recipe_ids = set(qs.values_list('id', flat=True))
    self.assertIn(self.vegetarian_recipe.id, recipe_ids)
    self.assertIn(self.regular_recipe.id, recipe_ids)

  def test_build_feed_with_single_active_pref_filters_correctly(self) -> None:
    """build_feed with vegetarian=True only returns recipes tagged 'vegetarian'."""
    self.profile.diet_type = {'vegetarian': True, 'vegan': False}
    self.profile.save(update_fields=['diet_type'])
    user = self._reload_user()
    qs = self._get_service().build_feed(user)
    recipe_ids = set(qs.values_list('id', flat=True))
    self.assertIn(self.vegetarian_recipe.id, recipe_ids)
    self.assertNotIn(self.regular_recipe.id, recipe_ids)
