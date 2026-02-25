from django.db.models import QuerySet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, ROUND_HALF_UP
from recipes.models import Recipe, RecipeIngredient
from ingredients.models import Ingredient


class RecipeNutritionView(APIView):
    """
    Returns the nutrional value of a recipe per 100 g of each ingredient
    """

    def get(self, request, recipe_id):
        try:
            recipe = Recipe.objects.prefetch_related(
                'recipeingredient_set__ingredient'
            ).get(pk=recipe_id)
        except Recipe.DoesNotExist:
            return Response(
                {"error": "Recipe not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
        nutrition = self.calculateNutritionPer100g(recipe)

        if "error" in  nutrition:
            return Response(nutrition, status=status.HTTP_404_NOT_FOUND)
        
        return Response(nutrition, status=status.HTTP_200_OK)

    def calculateNutritionPer100g(self, recipe):
        STD_Q = "_per_100g" # Based of Ingredients/models.py
        NUTRIENTS = [
            "calories" + STD_Q,
            "protein" + STD_Q,
            "carbs" + STD_Q,
            "fat" + STD_Q,
            "fiber" + STD_Q,
            "sugar" + STD_Q,
            "sodium" + STD_Q
        ]

        # Creates totals starting at 0 for each nutrient
        totals = {nutrient: Decimal("0.00") for nutrient in NUTRIENTS}
        recipe_weight = Decimal("0.00")

        #Query set data type
        #2 recipes
        #borger - meat, cheese, bread
        #chicken sandwich - chicken, lettuce, bread

        # 1. borger - meat 
        # 2. borger- cheese 
        # 3. borger - bread 
        # 4. Chicken sandwich - chicken 
        # 5. Chicken sandwich - lettuce 
        # 6. Chicken sandwich - bread

        #Final set
        # 1. borger - meat 
        # 2. borger- cheese 
        # 3. borger - bread 


        
        temp = RecipeIngredient.objects.all().filter(recipe = self)

        RecipeIngredient_set = temp.values("ingredient", "quantity", "unit")
        # RecipeIngredient_set  = [{ingredient: ingredient1, quantity: qty1, unit: unitQty1}]
        # List of dictionaries

        #List of quantity of each ingredient
        ingredient_qty_set = {} # {ingredient: grams}

        for eachRecipeIngredient in RecipeIngredient_set:
            name = eachRecipeIngredient["ingredient"]
            qty = eachRecipeIngredient["quantity"]
            ingredient_qty_set[name] = qty
            # dict {ingredient: qty}

        # Very inefficient, rewrite later -> Would be much easier with sql style joins -> do they exist in django?
        for eachRecipeIngredient in RecipeIngredient_set:
            #This retrieves the actual ingredient with all its nutrient qts
            ingredient = Ingredient.objects.all().filter(ingredient = eachRecipeIngredient["ingredient"]).values()
            for Nutrient in NUTRIENTS:

                '''
                1. Retrive the amount of a given nutrient in a specific nutrient per 100 grams (ex. 100 grams of chicken contains 50 grams of protein)
                2. Retrive the amount of a given ingredient in the given recipe (ex. 300 grams of chicken in a chicken bake)
                3. Divide the amount of nutrients in a given ingredient (from step 1) by 100 (for our example, 50/100 = 0.5)
                4. Multiply the result of 3 by the total amount of that ingredient 0.5 * 300 = 150 grams of protein for this ingredient in the recipe
                '''
                nutrient_in_ingredient_per_100g = ingredient[Nutrient]
                ingredient_qty_in_org_recipe = ingredient_qty_set[ingredient]
                ingredient_std = ingredient_qty_in_org_recipe / 100

                nutrient_in_ingredient_standardized_for_recipe = ingredient_std * nutrient_in_ingredient_per_100g

                totals[Nutrient] += nutrient_in_ingredient_standardized_for_recipe

        return totals

            

            
            
            



