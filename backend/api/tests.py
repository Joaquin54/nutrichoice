from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from ingredients.models import Ingredient
from nutrition.models import RecipeNutrition
from nutrition.services import (
    compute_and_store_nutrition,
    convert_from_grams,
    convert_to_grams,
    ConversionResult,
    format_quantity,
    validate_back_conversion,
)
from recipes.models import Recipe, RecipeIngredient

User = get_user_model()


class UnitConversionTestCase(TestCase):
    """Tests for the unit conversion helper."""

    def test_grams_identity(self) -> None:
        result = convert_to_grams(quantity=Decimal("150"), unit="g")
        self.assertEqual(result, Decimal("150"))

    def test_cup_to_grams(self) -> None:
        result = convert_to_grams(quantity=Decimal("2"), unit="cup")
        self.assertEqual(result, Decimal("480"))

    def test_tablespoon_to_grams(self) -> None:
        result = convert_to_grams(quantity=Decimal("3"), unit="tbsp")
        self.assertEqual(result, Decimal("45"))

    def test_teaspoon_to_grams(self) -> None:
        result = convert_to_grams(quantity=Decimal("1"), unit="tsp")
        self.assertEqual(result, Decimal("5"))

    def test_ounce_to_grams(self) -> None:
        result = convert_to_grams(quantity=Decimal("4"), unit="oz")
        self.assertEqual(result, Decimal("113.40"))

    def test_case_insensitive(self) -> None:
        result = convert_to_grams(quantity=Decimal("1"), unit="CUP")
        self.assertEqual(result, Decimal("240"))

    def test_unsupported_unit_raises(self) -> None:
        with self.assertRaises(ValueError):
            convert_to_grams(quantity=Decimal("1"), unit="bunch")


class NutritionComputationTestCase(TestCase):
    """Tests for the nutrition computation service."""

    def setUp(self) -> None:
        self.recipe = Recipe.objects.create(
            name="Burger",
            description="Burger with cheese",
            cuisine_type="American",
            dietary_tags=["Normal"],
        )
        self.cheese = Ingredient.objects.create(
            name="Cheese",
            calories_per_100g=200,
            protein_per_100g=0,
            carbs_per_100g=0,
            fat_per_100g=0,
            fiber_per_100g=0,
            sugar_per_100g=200,
            sodium_per_100g=200,
        )
        self.bread = Ingredient.objects.create(
            name="Bread",
            calories_per_100g=300,
            protein_per_100g=0,
            carbs_per_100g=200,
            fat_per_100g=0,
            fiber_per_100g=200,
            sugar_per_100g=200,
            sodium_per_100g=0,
        )
        self.meat = Ingredient.objects.create(
            name="Meat",
            calories_per_100g=200,
            protein_per_100g=200,
            carbs_per_100g=0,
            fat_per_100g=200,
            fiber_per_100g=0,
            sugar_per_100g=0,
            sodium_per_100g=0,
        )

    def test_nutrition_stored_on_compute(self) -> None:
        RecipeIngredient.objects.create(
            recipe=self.recipe, ingredient=self.cheese, quantity=100, unit="g"
        )
        RecipeIngredient.objects.create(
            recipe=self.recipe, ingredient=self.bread, quantity=100, unit="g"
        )
        RecipeIngredient.objects.create(
            recipe=self.recipe, ingredient=self.meat, quantity=100, unit="g"
        )

        result = compute_and_store_nutrition(recipe=self.recipe)

        self.assertTrue(result.ok)
        self.assertEqual(result.calories, Decimal("700.00"))
        self.assertEqual(result.protein, Decimal("200.00"))
        self.assertEqual(result.carbs, Decimal("200.00"))
        self.assertEqual(result.fat, Decimal("200.00"))
        self.assertEqual(result.fiber, Decimal("200.00"))
        self.assertEqual(result.sugar, Decimal("400.00"))
        self.assertEqual(result.sodium, Decimal("200.00"))

        # Verify persisted to database
        nutrition = RecipeNutrition.objects.get(recipe=self.recipe)
        self.assertEqual(nutrition.calories, Decimal("700.00"))

    def test_nutrition_with_mixed_units(self) -> None:
        RecipeIngredient.objects.create(
            recipe=self.recipe, ingredient=self.cheese, quantity=1, unit="cup"
        )

        result = compute_and_store_nutrition(recipe=self.recipe)

        # 1 cup = 240g. Cheese: 200 cal/100g -> 240/100 * 200 = 480 cal
        self.assertTrue(result.ok)
        self.assertEqual(result.calories, Decimal("480.00"))

    def test_unsupported_unit_rolls_back(self) -> None:
        RecipeIngredient.objects.create(
            recipe=self.recipe, ingredient=self.cheese, quantity=1, unit="bunch"
        )

        with self.assertRaises(ValueError):
            compute_and_store_nutrition(recipe=self.recipe)

        self.assertFalse(
            RecipeNutrition.objects.filter(recipe=self.recipe).exists()
        )

    def test_no_ingredients_returns_failure(self) -> None:
        result = compute_and_store_nutrition(recipe=self.recipe)
        self.assertFalse(result.ok)
        self.assertEqual(result.reason, "no_ingredients")


class NutritionViewTestCase(TestCase):
    """Tests for the GET /api/recipes/<id>/nutrition/ endpoint."""

    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.recipe = Recipe.objects.create(
            name="Pasta",
            description="Simple pasta",
            cuisine_type="Italian",
            dietary_tags=["Normal"],
            creator=self.user,
        )
        self.ingredient = Ingredient.objects.create(
            name="Spaghetti",
            calories_per_100g=158,
            protein_per_100g=6,
            carbs_per_100g=31,
            fat_per_100g=1,
            fiber_per_100g=2,
            sugar_per_100g=1,
            sodium_per_100g=1,
        )
        RecipeIngredient.objects.create(
            recipe=self.recipe, ingredient=self.ingredient, quantity=200, unit="g"
        )
        compute_and_store_nutrition(recipe=self.recipe)

    def test_get_nutrition(self) -> None:
        response = self.client.get(f"/api/recipes/{self.recipe.pk}/nutrition/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # 200g spaghetti: 158 cal/100g -> 316 cal
        self.assertEqual(data["calories"], "316.00")
        self.assertEqual(data["protein"], "12.00")
        self.assertIn("calculated_at", data)

    def test_recipe_not_found(self) -> None:
        response = self.client.get("/api/recipes/99999/nutrition/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["error"], "Recipe not found.")

    def test_nutrition_not_available(self) -> None:
        recipe_no_nutrition = Recipe.objects.create(
            name="Empty",
            description="No nutrition",
            cuisine_type="Test",
            dietary_tags=["Test"],
        )
        response = self.client.get(
            f"/api/recipes/{recipe_no_nutrition.pk}/nutrition/"
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json()["error"],
            "Nutrition data not available for this recipe.",
        )

    def test_unauthenticated_returns_401(self) -> None:
        self.client.force_authenticate(user=None)
        response = self.client.get(f"/api/recipes/{self.recipe.pk}/nutrition/")
        self.assertEqual(response.status_code, 401)


class ConvertFromGramsTestCase(TestCase):
    """Tests for the reverse conversion function convert_from_grams."""

    def test_cups_basic(self) -> None:
        """240g with water density should equal exactly 1 cup."""
        result = convert_from_grams(
            grams=Decimal("240"), target_unit="cups", ingredient_name=""
        )
        self.assertEqual(result.unit, "cup")
        self.assertEqual(result.quantity, Decimal("1"))
        self.assertIn("1 cup", result.display_string)

    def test_cascade_cups_to_tbsp(self) -> None:
        """30g is 0.125 cups (<¼), should cascade to tablespoons."""
        result = convert_from_grams(
            grams=Decimal("30"), target_unit="cups", ingredient_name=""
        )
        self.assertEqual(result.unit, "tbsp")
        self.assertEqual(result.quantity, Decimal("2"))

    def test_cascade_tbsp_to_tsp(self) -> None:
        """3g with water density: tbsp=0.2 (<1), tsp=0.6, should be tsp."""
        result = convert_from_grams(
            grams=Decimal("3"), target_unit="cups", ingredient_name=""
        )
        self.assertEqual(result.unit, "tsp")

    def test_cascade_to_pinch(self) -> None:
        """~0.5g should cascade all the way to 'a pinch'."""
        result = convert_from_grams(
            grams=Decimal("0.5"), target_unit="cups", ingredient_name=""
        )
        self.assertEqual(result.unit, "pinch")
        self.assertEqual(result.display_string, "a pinch")

    def test_ingredient_density_override(self) -> None:
        """125g flour should be 1 cup using flour density (125g/cup)."""
        result = convert_from_grams(
            grams=Decimal("125"), target_unit="cups", ingredient_name="Flour"
        )
        self.assertEqual(result.unit, "cup")
        self.assertEqual(result.quantity, Decimal("1"))

    def test_unknown_ingredient_water_fallback(self) -> None:
        """Unknown ingredient falls back to water density."""
        result = convert_from_grams(
            grams=Decimal("240"), target_unit="cups", ingredient_name="XyzFakeIngredient"
        )
        self.assertEqual(result.unit, "cup")
        self.assertEqual(result.quantity, Decimal("1"))

    def test_grams_target(self) -> None:
        """target_unit='grams' returns grams as-is."""
        result = convert_from_grams(
            grams=Decimal("350"), target_unit="grams", ingredient_name=""
        )
        self.assertEqual(result.unit, "g")
        self.assertEqual(result.quantity, Decimal("350"))
        self.assertIn("350g", result.display_string)

    def test_zero_grams(self) -> None:
        """0g should return quantity=0."""
        result = convert_from_grams(
            grams=Decimal("0"), target_unit="cups", ingredient_name=""
        )
        self.assertEqual(result.quantity, Decimal("0"))

    def test_negative_grams_raises(self) -> None:
        """Negative grams should raise ValueError."""
        with self.assertRaises(ValueError):
            convert_from_grams(
                grams=Decimal("-10"), target_unit="cups", ingredient_name=""
            )

    def test_bad_target_unit_raises(self) -> None:
        """Unrecognized target_unit should raise ValueError."""
        with self.assertRaises(ValueError):
            convert_from_grams(
                grams=Decimal("100"), target_unit="liters", ingredient_name=""
            )

    def test_tablespoons_target(self) -> None:
        """target_unit='tablespoons' starts cascade from tbsp, skips cups."""
        result = convert_from_grams(
            grams=Decimal("45"), target_unit="tablespoons", ingredient_name=""
        )
        self.assertEqual(result.unit, "tbsp")
        self.assertEqual(result.quantity, Decimal("3"))

    def test_substring_density_match(self) -> None:
        """Ingredient name 'All-Purpose Flour' should match density key 'flour'."""
        result = convert_from_grams(
            grams=Decimal("125"), target_unit="cups", ingredient_name="All-Purpose Flour"
        )
        self.assertEqual(result.unit, "cup")
        self.assertEqual(result.quantity, Decimal("1"))


class FormatQuantityTestCase(TestCase):
    """Tests for the display formatting utility format_quantity."""

    def test_half_cup(self) -> None:
        result = format_quantity(Decimal("0.5"), "cup")
        self.assertEqual(result, "½ cup")

    def test_quarter_tsp(self) -> None:
        result = format_quantity(Decimal("0.25"), "tsp")
        self.assertEqual(result, "¼ tsp")

    def test_three_quarter_cup(self) -> None:
        result = format_quantity(Decimal("0.75"), "cup")
        self.assertEqual(result, "¾ cup")

    def test_mixed_number(self) -> None:
        result = format_quantity(Decimal("2.5"), "cup")
        self.assertEqual(result, "2½ cups")

    def test_whole_grams(self) -> None:
        result = format_quantity(Decimal("350"), "g")
        self.assertEqual(result, "350g")

    def test_whole_cups(self) -> None:
        result = format_quantity(Decimal("2"), "cup")
        self.assertEqual(result, "2 cups")

    def test_one_cup(self) -> None:
        result = format_quantity(Decimal("1"), "cup")
        self.assertEqual(result, "1 cup")

    def test_one_third_cup(self) -> None:
        result = format_quantity(Decimal("0.333"), "cup")
        self.assertEqual(result, "⅓ cup")

    def test_two_thirds_cup(self) -> None:
        result = format_quantity(Decimal("0.667"), "cup")
        self.assertEqual(result, "⅔ cup")


class ValidateBackConversionTestCase(TestCase):
    """Tests for the back-conversion validation function."""

    def test_exact_match(self) -> None:
        """Exact back-conversion should pass."""
        result = validate_back_conversion(
            original_grams=Decimal("240"),
            display_quantity=Decimal("1"),
            display_unit="cup",
            ingredient_name="",
        )
        self.assertTrue(result)

    def test_within_2_percent_passes(self) -> None:
        """Back-conversion within 2% tolerance should pass."""
        # 237g -> 1 cup (240g) = 1.25% error, within 2%
        result = validate_back_conversion(
            original_grams=Decimal("237"),
            display_quantity=Decimal("1"),
            display_unit="cup",
            ingredient_name="",
        )
        self.assertTrue(result)

    def test_outside_2_percent_fails(self) -> None:
        """Back-conversion outside 2% should fail."""
        # 200g displayed as 1 cup (240g) = 20% error
        result = validate_back_conversion(
            original_grams=Decimal("200"),
            display_quantity=Decimal("1"),
            display_unit="cup",
            ingredient_name="",
        )
        self.assertFalse(result)

    def test_at_5_percent_logs_warning(self) -> None:
        """Back-conversion between 2-5% should log a warning."""
        # 233g -> 1 cup (240g) = ~3% error, within 2-5% band
        with self.assertLogs("nutrition.services.conversions", level="WARNING") as cm:
            result = validate_back_conversion(
                original_grams=Decimal("233"),
                display_quantity=Decimal("1"),
                display_unit="cup",
                ingredient_name="",
            )
        self.assertFalse(result)
        self.assertTrue(any("WARNING" in msg for msg in cm.output))

    def test_zero_grams_zero_display(self) -> None:
        """0g original with 0 display should pass."""
        result = validate_back_conversion(
            original_grams=Decimal("0"),
            display_quantity=Decimal("0"),
            display_unit="cup",
            ingredient_name="",
        )
        self.assertTrue(result)

    def test_ingredient_density_back_conversion(self) -> None:
        """Back-conversion should use ingredient density, not water density."""
        # 125g flour = 1 cup (flour density), back-convert should match
        result = validate_back_conversion(
            original_grams=Decimal("125"),
            display_quantity=Decimal("1"),
            display_unit="cup",
            ingredient_name="Flour",
        )
        self.assertTrue(result)


class MeasureTypeIntegrationTestCase(TestCase):
    """DRF integration tests for measure_type and display_quantities."""

    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="measureuser", password="testpass123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.flour = Ingredient.objects.create(
            name="Flour",
            calories_per_100g=364,
            protein_per_100g=10,
            carbs_per_100g=76,
            fat_per_100g=1,
            fiber_per_100g=3,
            sugar_per_100g=0,
            sodium_per_100g=2,
        )

    def test_create_recipe_with_cups(self) -> None:
        """POST with measure_type='cups' returns converted display_quantities."""
        payload = {
            "name": "Flour Mix",
            "description": "Simple flour recipe",
            "cuisine_type": "American",
            "dietary_tags": ["Normal"],
            "measure_type": "cups",
            "ingredients": [
                {"ingredient": self.flour.pk, "quantity": 125, "unit": "g"}
            ],
            "instructions": [
                {"step_number": 1, "text": "Mix flour", "estimated_cooktime": 5}
            ],
        }
        response = self.client.post("/api/recipes/create/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["measure_type"], "cups")
        self.assertIn("display_quantities", data)
        self.assertTrue(len(data["display_quantities"]) > 0)
        dq = data["display_quantities"][0]
        self.assertIn("ingredient", dq)
        self.assertIn("display_string", dq)
        # 125g flour = 1 cup (flour density), should show cup conversion with gram parenthetical
        self.assertIn("cup", dq["display_string"])
        self.assertIn("125g", dq["display_string"])

    def test_create_recipe_default_grams(self) -> None:
        """POST without measure_type defaults to 'grams'."""
        payload = {
            "name": "Gram Default",
            "description": "Default recipe",
            "cuisine_type": "Italian",
            "dietary_tags": ["Normal"],
            "ingredients": [
                {"ingredient": self.flour.pk, "quantity": 200, "unit": "g"}
            ],
            "instructions": [
                {"step_number": 1, "text": "Combine", "estimated_cooktime": 5}
            ],
        }
        response = self.client.post("/api/recipes/create/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["measure_type"], "grams")

    def test_get_recipe_detail_with_cups(self) -> None:
        """GET detail for a cups recipe shows converted display_quantities."""
        recipe = Recipe.objects.create(
            name="Cup Recipe",
            description="A recipe",
            cuisine_type="American",
            dietary_tags=["Normal"],
            creator=self.user,
            measure_type="cups",
        )
        RecipeIngredient.objects.create(
            recipe=recipe, ingredient=self.flour, quantity=250, unit="g"
        )
        compute_and_store_nutrition(recipe=recipe)

        response = self.client.get(f"/api/recipes/{recipe.pk}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["measure_type"], "cups")
        self.assertTrue(len(data["display_quantities"]) > 0)
        dq = data["display_quantities"][0]
        self.assertIn("cup", dq["display_string"])

    def test_invalid_measure_type_rejected(self) -> None:
        """POST with invalid measure_type returns 400."""
        payload = {
            "name": "Bad Measure",
            "description": "Invalid",
            "cuisine_type": "Other",
            "dietary_tags": ["Normal"],
            "measure_type": "invalid",
            "ingredients": [
                {"ingredient": self.flour.pk, "quantity": 100, "unit": "g"}
            ],
            "instructions": [
                {"step_number": 1, "text": "Do something", "estimated_cooktime": 5}
            ],
        }
        response = self.client.post("/api/recipes/create/", payload, format="json")
        self.assertEqual(response.status_code, 400)
