"""
Management command to seed the official NutriChoice account, ingredients, and recipes.

Usage:
    python manage.py seed_official_data           # seed the database
    python manage.py seed_official_data --dry-run # validate without writing

The command is fully idempotent — re-running is a safe no-op.
"""

from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from ingredients.models import Ingredient
from profiles.models import UserProfile
from recipes.models import Recipe
from recipes.services.diet_tags import normalize_dietary_tags


# ---------------------------------------------------------------------------
# Source data — transcribed from public.sql dump
# Nutritional values are per 100g (matching column names in the Django model).
# ---------------------------------------------------------------------------

INGREDIENT_DATA: list[dict[str, Any]] = [
    {"name": "GroundBeef",      "calories": 250,  "protein": 26,   "carbs": 0,    "fat": 15,  "fiber": 0,    "sugar": 0,   "sodium": 72},
    {"name": "Chicken",         "calories": 239,  "protein": 27,   "carbs": 0,    "fat": 14,  "fiber": 0,    "sugar": 0,   "sodium": 74},
    {"name": "Turkey",          "calories": 189,  "protein": 29,   "carbs": 0,    "fat": 7,   "fiber": 0,    "sugar": 0,   "sodium": 82},
    {"name": "Ham",             "calories": 145,  "protein": 18,   "carbs": 1.5,  "fat": 5,   "fiber": 0,    "sugar": 1,   "sodium": 1200},
    {"name": "MahiMahi",        "calories": 130,  "protein": 20,   "carbs": 0,    "fat": 5,   "fiber": 0,    "sugar": 0,   "sodium": 90},
    {"name": "Salmon",          "calories": 208,  "protein": 20,   "carbs": 0,    "fat": 13,  "fiber": 0,    "sugar": 0,   "sodium": 59},
    {"name": "Tuna",            "calories": 130,  "protein": 30,   "carbs": 0,    "fat": 1,   "fiber": 0,    "sugar": 0,   "sodium": 37},
    {"name": "Shrimp",          "calories": 99,   "protein": 24,   "carbs": 0,    "fat": 0.3, "fiber": 0,    "sugar": 0,   "sodium": 111},
    {"name": "Egg",             "calories": 155,  "protein": 13,   "carbs": 1.1,  "fat": 11,  "fiber": 0,    "sugar": 0.6, "sodium": 124},
    # source id=10 is absent from the dump — gap preserved, not seeded
    {"name": "Tofu",            "calories": 76,   "protein": 8,    "carbs": 2,    "fat": 5,   "fiber": 0.3,  "sugar": 0.6, "sodium": 14},
    {"name": "Chickpeas",       "calories": 364,  "protein": 19,   "carbs": 61,   "fat": 6,   "fiber": 17.4, "sugar": 11,  "sodium": 24},
    {"name": "Lentils",         "calories": 353,  "protein": 25,   "carbs": 60,   "fat": 1,   "fiber": 10.7, "sugar": 2,   "sodium": 6},
    {"name": "CottageCheese",   "calories": 98,   "protein": 11,   "carbs": 3.4,  "fat": 4.3, "fiber": 0,    "sugar": 2.7, "sodium": 364},
    {"name": "Cheese",          "calories": 402,  "protein": 25,   "carbs": 1.3,  "fat": 33,  "fiber": 0,    "sugar": 0.5, "sodium": 621},
    {"name": "Parmesan",        "calories": 431,  "protein": 36,   "carbs": 4.1,  "fat": 26,  "fiber": 0,    "sugar": 0.9, "sodium": 1529},
    {"name": "CreamCheese",     "calories": 342,  "protein": 6,    "carbs": 4,    "fat": 34,  "fiber": 0,    "sugar": 3.2, "sodium": 321},
    {"name": "Rice",            "calories": 130,  "protein": 7,    "carbs": 28,   "fat": 0.3, "fiber": 0.6,  "sugar": 0.1, "sodium": 2},
    {"name": "Pasta",           "calories": 371,  "protein": 13,   "carbs": 71,   "fat": 1.5, "fiber": 3.2,  "sugar": 2.7, "sodium": 6},
    {"name": "Bread",           "calories": 265,  "protein": 9,    "carbs": 49,   "fat": 3.2, "fiber": 2.7,  "sugar": 5,   "sodium": 491},
    {"name": "Tortilla",        "calories": 298,  "protein": 8,    "carbs": 48,   "fat": 5,   "fiber": 2.9,  "sugar": 2,   "sodium": 680},
    {"name": "Oats",            "calories": 389,  "protein": 17,   "carbs": 66,   "fat": 7,   "fiber": 10.6, "sugar": 1,   "sodium": 2},
    {"name": "Noodles",         "calories": 138,  "protein": 9,    "carbs": 25,   "fat": 0.5, "fiber": 1.2,  "sugar": 1,   "sodium": 5},
    {"name": "Quinoa",          "calories": 368,  "protein": 14,   "carbs": 64,   "fat": 6,   "fiber": 7,    "sugar": 3,   "sodium": 5},
    {"name": "SweetPotato",     "calories": 86,   "protein": 1.6,  "carbs": 20,   "fat": 0.1, "fiber": 3,    "sugar": 4.2, "sodium": 55},
    {"name": "Oil",             "calories": 884,  "protein": 0,    "carbs": 0,    "fat": 100, "fiber": 0,    "sugar": 0,   "sodium": 0},
    {"name": "OliveOil",        "calories": 884,  "protein": 0,    "carbs": 0,    "fat": 100, "fiber": 0,    "sugar": 0,   "sodium": 2},
    {"name": "Butter",          "calories": 717,  "protein": 0.9,  "carbs": 0.1,  "fat": 81,  "fiber": 0,    "sugar": 0.1, "sodium": 643},
    {"name": "Mayo",            "calories": 680,  "protein": 1,    "carbs": 0.6,  "fat": 75,  "fiber": 0,    "sugar": 0.4, "sodium": 635},
    {"name": "Mustard",         "calories": 60,   "protein": 4,    "carbs": 7,    "fat": 4,   "fiber": 3.3,  "sugar": 3,   "sodium": 1100},
    {"name": "Hummus",          "calories": 166,  "protein": 8,    "carbs": 14,   "fat": 10,  "fiber": 6,    "sugar": 0.3, "sodium": 379},
    {"name": "Peanut Butter",   "calories": 588,  "protein": 25,   "carbs": 20,   "fat": 50,  "fiber": 6,    "sugar": 9,   "sodium": 426},
    {"name": "Avocado",         "calories": 160,  "protein": 2,    "carbs": 9,    "fat": 15,  "fiber": 6.7,  "sugar": 0.7, "sodium": 7},
    {"name": "Walnuts",         "calories": 654,  "protein": 15,   "carbs": 14,   "fat": 65,  "fiber": 6.7,  "sugar": 2.6, "sodium": 2},
    {"name": "AlmondMilk",      "calories": 17,   "protein": 0.4,  "carbs": 0.6,  "fat": 1.1, "fiber": 0.2,  "sugar": 0,   "sodium": 59},
    {"name": "CoconutMilk",     "calories": 230,  "protein": 2.3,  "carbs": 6,    "fat": 24,  "fiber": 2.2,  "sugar": 3.3, "sodium": 15},
    {"name": "Cream",           "calories": 345,  "protein": 2.1,  "carbs": 3.4,  "fat": 37,  "fiber": 0,    "sugar": 2.8, "sodium": 38},
    {"name": "Lettuce",         "calories": 15,   "protein": 1.4,  "carbs": 2.9,  "fat": 0.2, "fiber": 1.3,  "sugar": 0.8, "sodium": 28},
    {"name": "Tomato",          "calories": 18,   "protein": 0.9,  "carbs": 3.9,  "fat": 0.2, "fiber": 1.2,  "sugar": 2.6, "sodium": 5},
    {"name": "Cucumber",        "calories": 15,   "protein": 0.7,  "carbs": 3.6,  "fat": 0.1, "fiber": 0.5,  "sugar": 1.7, "sodium": 2},
    {"name": "Onion",           "calories": 40,   "protein": 1.1,  "carbs": 9.3,  "fat": 0.1, "fiber": 1.7,  "sugar": 4.2, "sodium": 4},
    {"name": "Pepper",          "calories": 31,   "protein": 1,    "carbs": 6,    "fat": 0.3, "fiber": 2.1,  "sugar": 4.2, "sodium": 4},
    {"name": "BellPepper",      "calories": 31,   "protein": 1,    "carbs": 6,    "fat": 0.3, "fiber": 2.1,  "sugar": 4.2, "sodium": 4},
    {"name": "Broccoli",        "calories": 34,   "protein": 2.8,  "carbs": 7,    "fat": 0.4, "fiber": 2.6,  "sugar": 1.7, "sodium": 33},
    {"name": "Zucchini",        "calories": 17,   "protein": 1.2,  "carbs": 3.1,  "fat": 0.3, "fiber": 1,    "sugar": 2.5, "sodium": 8},
    {"name": "Eggplant",        "calories": 25,   "protein": 1,    "carbs": 6,    "fat": 0.2, "fiber": 3,    "sugar": 3.5, "sodium": 2},
    {"name": "Spinach",         "calories": 23,   "protein": 2.9,  "carbs": 3.6,  "fat": 0.4, "fiber": 2.2,  "sugar": 0.4, "sodium": 79},
    {"name": "Carrot",          "calories": 41,   "protein": 0.9,  "carbs": 10,   "fat": 0.2, "fiber": 2.8,  "sugar": 4.7, "sodium": 69},
    {"name": "Cabbage",         "calories": 25,   "protein": 1.3,  "carbs": 5.8,  "fat": 0.1, "fiber": 2.5,  "sugar": 3.2, "sodium": 18},
    {"name": "Celery",          "calories": 14,   "protein": 0.7,  "carbs": 3,    "fat": 0.2, "fiber": 1.6,  "sugar": 1.3, "sodium": 80},
    {"name": "Vegetables",      "calories": 30,   "protein": 1.5,  "carbs": 5,    "fat": 0.2, "fiber": 2.5,  "sugar": 2,   "sodium": 30},
    {"name": "Mushroom",        "calories": 22,   "protein": 3.1,  "carbs": 3.3,  "fat": 0.3, "fiber": 1,    "sugar": 2,   "sodium": 5},
    {"name": "Apple",           "calories": 52,   "protein": 0.3,  "carbs": 14,   "fat": 0.2, "fiber": 2.4,  "sugar": 10,  "sodium": 1},
    {"name": "Banana",          "calories": 89,   "protein": 1.1,  "carbs": 23,   "fat": 0.3, "fiber": 2.6,  "sugar": 12,  "sodium": 1},
    {"name": "Lemon",           "calories": 29,   "protein": 1.1,  "carbs": 9,    "fat": 0.3, "fiber": 2.8,  "sugar": 2.5, "sodium": 2},
    {"name": "Lime",            "calories": 30,   "protein": 0.7,  "carbs": 11,   "fat": 0.2, "fiber": 2.8,  "sugar": 1.7, "sodium": 2},
    {"name": "Berries",         "calories": 57,   "protein": 1,    "carbs": 12,   "fat": 0.5, "fiber": 6.5,  "sugar": 5,   "sodium": 1},
    {"name": "Salt",            "calories": 0,    "protein": 0,    "carbs": 0,    "fat": 0,   "fiber": 0,    "sugar": 0,   "sodium": 38758},
    {"name": "Garlic",          "calories": 149,  "protein": 6.4,  "carbs": 33,   "fat": 0.5, "fiber": 2.1,  "sugar": 1,   "sodium": 17},
    {"name": "Basil",           "calories": 23,   "protein": 3.2,  "carbs": 2.7,  "fat": 0.6, "fiber": 1.6,  "sugar": 0.3, "sodium": 4},
    {"name": "Dill",            "calories": 43,   "protein": 3.5,  "carbs": 7,    "fat": 1.1, "fiber": 2.1,  "sugar": 0,   "sodium": 61},
    {"name": "Cinnamon",        "calories": 247,  "protein": 4,    "carbs": 81,   "fat": 1.2, "fiber": 53.1, "sugar": 2.2, "sodium": 10},
    {"name": "Vanilla",         "calories": 288,  "protein": 0.1,  "carbs": 13,   "fat": 0.1, "fiber": 0,    "sugar": 13,  "sodium": 9},
    {"name": "SoySauce",        "calories": 446,  "protein": 36,   "carbs": 30,   "fat": 20,  "fiber": 0.81, "sugar": 7,   "sodium": 5493},
    {"name": "Vinegar",         "calories": 18,   "protein": 0,    "carbs": 0.9,  "fat": 0,   "fiber": 0,    "sugar": 0.4, "sodium": 5},
    {"name": "SesameSeeds",     "calories": 573,  "protein": 18,   "carbs": 23,   "fat": 50,  "fiber": 11.8, "sugar": 0.3, "sodium": 11},
    {"name": "Honey",           "calories": 304,  "protein": 0.3,  "carbs": 82,   "fat": 0,   "fiber": 0,    "sugar": 82,  "sodium": 4},
    {"name": "Maple",           "calories": 260,  "protein": 0,    "carbs": 67,   "fat": 0.2, "fiber": 0,    "sugar": 60,  "sodium": 12},
    {"name": "Chia",            "calories": 486,  "protein": 17,   "carbs": 42,   "fat": 31,  "fiber": 34.4, "sugar": 0,   "sodium": 16},
    {"name": "AlmondFlour",     "calories": 571,  "protein": 21,   "carbs": 22,   "fat": 53,  "fiber": 10.4, "sugar": 4,   "sodium": 1},
    {"name": "BakingPowder",    "calories": 53,   "protein": 0,    "carbs": 28,   "fat": 0,   "fiber": 0,    "sugar": 0,   "sodium": 10600},
    {"name": "Ice",             "calories": 0,    "protein": 0,    "carbs": 0,    "fat": 0,   "fiber": 0,    "sugar": 0,   "sodium": 0},
]

RECIPE_DATA: list[dict[str, Any]] = [
    {"name": "Beef Stirfry",                    "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Chinese",          "dietary_tags": []},
    {"name": "Chicken and Chickpea Salad",       "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Chicken Pasta",                    "description": "", "meal_type": "Lunch",      "prep_time": 45,  "cuisine_type": "Italian",          "dietary_tags": []},
    {"name": "Grilled Chicken Salad",            "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Turkey Wrap",                      "description": "", "meal_type": "Lunch",      "prep_time": 20,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Chicken Rice Bowl",                "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Asian Fusion",     "dietary_tags": []},
    {"name": "Turkey Rice",                      "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": []},
    {"name": "Ham and Cheese Sandwich",          "description": "", "meal_type": "Breakfast",  "prep_time": 20,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Creamy Chicken Broccoli",          "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": ["keto"]},
    {"name": "Grilled Steak",                    "description": "", "meal_type": "Lunch",      "prep_time": 45,  "cuisine_type": "American",         "dietary_tags": ["keto"]},
    {"name": "Zucchini Beef Casserole",          "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["keto"]},
    {"name": "Chicken Avocado Salad",            "description": "", "meal_type": "Dinner",     "prep_time": 20,  "cuisine_type": "American",         "dietary_tags": ["keto"]},
    {"name": "Eggplant Lasagna",                 "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": ["keto"]},
    {"name": "Salmon Spinach Alfredo",           "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": ["keto"]},
    {"name": "Fish  Tacos",                      "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Mexican",          "dietary_tags": []},
    {"name": "Grilled fish Salad",               "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Shrimp Rice Bowl",                 "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Asian Fusion",     "dietary_tags": []},
    {"name": "Sushi Bowl",                       "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Japanese",         "dietary_tags": []},
    {"name": "Tuna Sandwich",                    "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Shrimp Stirfry",                   "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Chinese",          "dietary_tags": []},
    {"name": "Tuna Stew",                        "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": []},
    {"name": "Grilled Salmon",                   "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": []},
    {"name": "Shrimp Pasta",                     "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": []},
    {"name": "Smoked Salmon Toast",              "description": "", "meal_type": "Breakfast",  "prep_time": 45,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Tuna Egg Bowl",                    "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": []},
    {"name": "Shrimp Zucchini Stirfry",          "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Chinese",          "dietary_tags": ["keto"]},
    {"name": "Avocado Tuna Salad",               "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["keto"]},
    {"name": "Pesto Pasta",                      "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": ["vegetarian"]},
    {"name": "Stuffed Bell Pepper",              "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Vegetable Risotto",                "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": ["vegetarian"]},
    {"name": "Vegetable Omelette",               "description": "", "meal_type": "Dinner",     "prep_time": 20,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Caprese Toast",                    "description": "", "meal_type": "Breakfast",  "prep_time": 20,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Cottage Cheese Bowl",              "description": "", "meal_type": "Breakfast",  "prep_time": 20,  "cuisine_type": "International",    "dietary_tags": ["vegetarian"]},
    {"name": "Egg and Avocado Toast",            "description": "", "meal_type": "Breakfast",  "prep_time": 20,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Honey and Banana Oatmeal",         "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Peanut Butter Banana Smoothie",    "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Quesadilla",                       "description": "", "meal_type": "Breakfast",  "prep_time": 20,  "cuisine_type": "Mexican",          "dietary_tags": ["vegetarian"]},
    {"name": "Yogurt Parfait",                   "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Egg Muffins",                      "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian", "keto"]},
    {"name": "Keto Pancakes",                    "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian", "keto"]},
    {"name": "Lentil Salad",                     "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Quinoa Bowl",                      "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Rice Vegetables",                  "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Sweet Potato Bowl",                "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Tofu Noodles",                     "description": "", "meal_type": "Lunch",      "prep_time": 45,  "cuisine_type": "International",    "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Veggie Wrap",                      "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Chickpea Curry",                   "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Indian",           "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Vegetable Soup",                   "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Chia Pudding",                     "description": "", "meal_type": "Breakfast",  "prep_time": 20,  "cuisine_type": "International",    "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Tofu Scramble",                    "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Beef Burrito Bowl",                "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Mexican",          "dietary_tags": []},
    {"name": "Chicken Teriyaki Bowl",            "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Japanese",         "dietary_tags": []},
    {"name": "Turkey Chili",                     "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Chicken Fajitas",                  "description": "", "meal_type": "Dinner",     "prep_time": 45,  "cuisine_type": "Mexican",          "dietary_tags": []},
    {"name": "Spaghetti Bolognese",              "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": []},
    {"name": "BBQ Chicken Sandwich",             "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Chicken Caesar Wrap",              "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Beef Fried Rice",                  "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Chinese",          "dietary_tags": []},
    {"name": "Ham Omelette",                     "description": "", "meal_type": "Breakfast",  "prep_time": 20,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Chicken Pita Pocket",              "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": []},
    {"name": "Turkey Quinoa Bowl",               "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "International",    "dietary_tags": []},
    {"name": "Chicken Curry",                    "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Indian",           "dietary_tags": []},
    {"name": "Turkey Burger",                    "description": "", "meal_type": "Lunch",      "prep_time": 45,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Chicken Noodle Soup",              "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Tuna Pasta Salad",                 "description": "", "meal_type": "Lunch",      "prep_time": 45,  "cuisine_type": "Italian",          "dietary_tags": []},
    {"name": "Shrimp Tacos",                     "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Mexican",          "dietary_tags": []},
    {"name": "Mushroom Pasta",                   "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": ["vegetarian"]},
    {"name": "Vegetable Pizza",                  "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": ["vegetarian"]},
    {"name": "Greek Salad",                      "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Greek",            "dietary_tags": ["vegetarian"]},
    {"name": "Chicken Tenders",                  "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Spaghetti Carbonara",              "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": []},
    {"name": "Beef Lasagna",                     "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": []},
    {"name": "Arepa Reina Pepiada",              "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Venezuelan",       "dietary_tags": []},
    {"name": "Enchiladas Verdes",                "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Mexican",          "dietary_tags": []},
    {"name": "Chicken Shawarma",                 "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Middle Eastern",   "dietary_tags": []},
    {"name": "Ratatouille",                      "description": "", "meal_type": "Dinner",     "prep_time": 90,  "cuisine_type": "French",           "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Cheeseburger",                     "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Tacos al Pastor",                  "description": "", "meal_type": "Lunch",      "prep_time": 45,  "cuisine_type": "Mexican",          "dietary_tags": []},
    {"name": "Mac and Cheese",                   "description": "", "meal_type": "Lunch",      "prep_time": 45,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Chimichurri Steak",                "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Argentinian",      "dietary_tags": []},
    {"name": "Peruvian Ceviche",                 "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Peruvian",         "dietary_tags": []},
    {"name": "Fish and Chips",                   "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "British",          "dietary_tags": []},
    {"name": "Ramen Bowl",                       "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Japanese",         "dietary_tags": []},
    {"name": "Mediterranean Lamb Kebabs",        "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Mediterranean",    "dietary_tags": []},
    {"name": "Creamy Spinach Gnocchi",           "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": ["vegetarian"]},
    {"name": "Veggie Lasagna",                   "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Italian",          "dietary_tags": ["vegetarian"]},
    {"name": "Ribeye Steak",                     "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "Cordon Bleu Chicken",              "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "French",           "dietary_tags": []},
    {"name": "Almond Pancakes",                  "description": "", "meal_type": "Breakfast",  "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Broccoli Burger",                  "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": ["vegetarian"]},
    {"name": "Vegan Chow Mein",                  "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Chinese",          "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Pasta and Bean Soup",              "description": "", "meal_type": "Dinner",     "prep_time": 45,  "cuisine_type": "Italian",          "dietary_tags": ["vegetarian", "vegan"]},
    {"name": "Borscht",                          "description": "", "meal_type": "Dinner",     "prep_time": 90,  "cuisine_type": "Eastern European", "dietary_tags": ["vegetarian"]},
    {"name": "Moroccan Tagine",                  "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "Moroccan",         "dietary_tags": []},
    {"name": "Kanda (Peanut Stew)",              "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "West African",     "dietary_tags": []},
    {"name": "Venezuelan Empanadas",             "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Venezuelan",       "dietary_tags": []},
    {"name": "Argentinian Empanadas",            "description": "", "meal_type": "Lunch",      "prep_time": 60,  "cuisine_type": "Argentinian",      "dietary_tags": []},
    {"name": "Wagyu with Steak Sauce",           "description": "", "meal_type": "Dinner",     "prep_time": 60,  "cuisine_type": "American",         "dietary_tags": []},
    {"name": "South African Curry and Rice",     "description": "", "meal_type": "Lunch",      "prep_time": 90,  "cuisine_type": "South African",    "dietary_tags": []},
    {"name": "Meatballs",                        "description": "", "meal_type": "Lunch",      "prep_time": 45,  "cuisine_type": "Italian",          "dietary_tags": []},
]


class Command(BaseCommand):
    help = "Idempotently seed the official NutriChoice account, ingredients, and recipes."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate and report what would be inserted without writing to the database.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        dry_run: bool = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be written.\n"))

        with transaction.atomic():
            user = self._seed_official_account(dry_run)
            ingredients_created = self._seed_ingredients(dry_run)
            recipes_created = self._seed_recipes(user, dry_run)

            if dry_run:
                # Roll back so nothing is persisted during a dry-run
                transaction.set_rollback(True)

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. "
                f"Ingredients created: {ingredients_created}  "
                f"Recipes created: {recipes_created}"
            )
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _seed_official_account(self, dry_run: bool) -> Any:
        """Create or retrieve the NutriChoice official superuser account."""
        User = get_user_model()
        existing = User.objects.filter(username="nutrichoice").first()

        if existing:
            self.stdout.write(f"  [skip] Official account already exists (id={existing.pk})")
            return existing

        self.stdout.write("  [create] Official account 'nutrichoice'")

        if dry_run:
            # Return a transient unsaved instance so the rest of the dry-run can proceed
            user = User(
                username="nutrichoice",
                email="official@nutrichoice.com",
                first_name="NutriChoice",
                last_name="Official",
                is_staff=True,
                is_superuser=True,
                is_active=True,
            )
            return user

        user = User.objects.create(
            username="nutrichoice",
            email="official@nutrichoice.com",
            first_name="NutriChoice",
            last_name="Official",
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        user.set_unusable_password()
        user.save()

        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "bio": "Official NutriChoice account. Curated recipes and ingredients.",
                "diet_type": {},
            },
        )

        return user

    def _seed_ingredients(self, dry_run: bool) -> int:
        """Insert ingredients that do not yet exist. Returns count of newly created rows."""
        created = 0

        for row in INGREDIENT_DATA:
            if Ingredient.objects.filter(name=row["name"]).exists():
                continue

            self.stdout.write(f"  [create] Ingredient: {row['name']}")
            created += 1

            if not dry_run:
                Ingredient(
                    name=row["name"],
                    calories_per_100g=Decimal(str(row["calories"])),
                    protein_per_100g=Decimal(str(row["protein"])),
                    carbs_per_100g=Decimal(str(row["carbs"])),
                    fat_per_100g=Decimal(str(row["fat"])),
                    fiber_per_100g=Decimal(str(row["fiber"])),
                    sugar_per_100g=Decimal(str(row["sugar"])),
                    sodium_per_100g=Decimal(str(row["sodium"])),
                    # default_unit defaults to "g" — no override needed
                ).save()

        return created

    def _seed_recipes(self, user: Any, dry_run: bool) -> int:
        """Insert recipes that do not yet exist. Returns count of newly created rows."""
        created = 0

        for row in RECIPE_DATA:
            if Recipe.objects.filter(name=row["name"]).exists():
                continue

            self.stdout.write(f"  [create] Recipe: {row['name']}")
            created += 1

            if not dry_run:
                Recipe.objects.create(
                    name=row["name"],
                    description=row["description"],
                    meal_type=row["meal_type"],
                    cuisine_type=row["cuisine_type"],
                    dietary_tags=normalize_dietary_tags(row["dietary_tags"]),
                    creator=user,
                )

        return created
