from django.test import TestCase

from views.nutrition import RecipeNutritionView
from ingredients.models import Ingredient
from recipes.models import RecipeIngredient, Recipe

#https://docs.djangoproject.com/en/6.0/topics/testing/overview/


#Test case for nutrition.py

class NutritionViewTestCase(TestCase):
    def setUp(self):
        rec = Recipe.objects.create(name = "Burger", instructions = "Cook Burger", 
                              description = "Burger with chhese", cuisine_type = "American",
                              dietary_tags = ["Normal",])
        ing1 = Ingredient.objects.create(
            name = "Cheese",
            calories_per_100g = 200,
            protein_per_100g = 0,
            carbs_per_100g = 0,
            fat_per_100g = 0,
            fiber_per_100g = 0,
            sugar_per_100g = 200,
            sodium_per_100g = 200
        )
        ing2 = Ingredient.objects.create(
            name = "Bread",
            calories_per_100g = 300,
            protein_per_100g = 0,
            carbs_per_100g = 200,
            fat_per_100g = 0,
            fiber_per_100g = 200,
            sugar_per_100g = 200,
            sodium_per_100g = 0
        )
        ing3 = Ingredient.objects.create(
            name = "Meat",
            calories_per_100g = 200,
            protein_per_100g = 200,
            carbs_per_100g = 0,
            fat_per_100g = 200,
            fiber_per_100g = 0,
            sugar_per_100g = 0,
            sodium_per_100g = 0
        )

        RecipeIngredient.objects.create(recipe = rec.id, ingredient = ing1.id, quantity = 100, unit ="g")
        RecipeIngredient.objects.create(recipe = rec.id, ingredient = ing2.id, quantity = 100, unit ="g")
        RecipeIngredient.objects.create(recipe = rec.id, ingredient = ing3.id, quantity = 100, unit ="g")

        #Tests if proper values of nutriton (Calories, protein, carbohydrates, etc) are returned
    def test_nutrition_calculated_properly(self):
        rec = Recipe.objects.get("Burger")
        obj = RecipeNutritionView()
        print(obj.calculateNutritionPer100g(rec))
        


