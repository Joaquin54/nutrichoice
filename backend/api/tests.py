from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from ingredients.models import Ingredient
from nutrition.models import RecipeNutrition
from nutrition.services import compute_and_store_nutrition, convert_to_grams
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
