from mongoengine import (
    Document, EmbeddedDocument,
    StringField, IntField, FloatField, DateTimeField,
    ListField, EmbeddedDocumentField, UUIDField,
    ReferenceField, DecimalField, URLField, DictField
)
from decimal import Decimal
import uuid
from datetime import datetime

PROTEIN_KCAL = 4
CARBS_KCAL = 4
FAT_KCAL = 9
ALCOHOL_KCAL = 7


class SavedRecipe(Document):
    public_id = UUIDField(binary=False, default=uuid.uuid4)
    user_id = UUIDField(binary=False, default=uuid.uuid4, unique=True)
    recipe_id = UUIDField(binary=False, default=uuid.uuid4, unique=True)
    notes = StringField()
    saved_date = DateTimeField()


class RecipeIngredientEmbedded(EmbeddedDocument):
    ingredient_id = UUIDField(binary=False, required=True)
    ingredient_name = StringField()
    quantity_grams = FloatField()
    display_quantity = FloatField()
    display_unit = StringField()
    preparation_notes = StringField()
    order = IntField()


class RecipeInstructionEmbedded(EmbeddedDocument):
    step_number = IntField()
    instruction = StringField()
    duration_minutes = IntField()


class Recipe(Document):
    public_id = UUIDField(binary=False, default=uuid.uuid4, unique=True)
    user_id = StringField(required=False)
    title = StringField(max_length=50)
    description = StringField(max_length=300)
    image_url = StringField(required=True)
    prep_time = IntField()
    cook_time = IntField()
    ingredients = ListField(EmbeddedDocumentField(RecipeIngredientEmbedded))
    instructions = ListField(EmbeddedDocumentField(RecipeInstructionEmbedded))
    nutrition_per_serving = DictField()
    nutrition_total = DictField()
    cuisine_type = StringField()
    dietary_tags = DictField(StringField())
    is_public = bool()
    date_time_created = DateTimeField()
    date_time_updated = DateTimeField()

    def calculate_nutrition(self):
        totals = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
            'sodium': 0
        }

        for recipe_ingredient in self.ingredients:
            master_ingredient = Ingredient.objects(
                public_id=recipe_ingredient.ingredient_id).first()

            if not master_ingredient:
                continue

            nutrition = master_ingredient.get_nutrition_for_grams(
                recipe_ingredient.quantity_grams)

            for nutrient in totals.keys():
                totals[nutrient] += nutrition[nutrient]

        self.nutrition_total = totals
        self.nutrition_per_serving = totals

    def save(self, *args, **kwargs):
        if not self.date_time_created:
            self.date_time_created = datetime.utcnow()

        self.calculate_nutrition()

        self.date_time_updated = datetime.utcnow()

        return super(Recipe, self).save(*args, **kwargs)


class Ingredient(Document):
    public_id = UUIDField(binary=False, default=uuid.uuid4, unique=True)
    name = StringField(required=True, max_length=200)
    category = StringField(
        required=True,
        choices=[
            'protein', 'vegetable', 'fruit', 'grain',
            'dairy', 'spice', 'condiment', 'other'
        ]
    )

    calories = DecimalField(required=True, min_value=0, precision=2)
    protein = DecimalField(required=True, min_value=0, precision=2)
    carbs = DecimalField(required=True, min_value=0, precision=2)
    fat = DecimalField(required=True, min_value=0, precision=2)
    fiber = DecimalField(required=True, min_value=0, precision=2)
    sugar = DecimalField(required=True, min_value=0, precision=2)
    sodium = DecimalField(required=True, min_value=0, precision=2)

    conversions = DictField(default=dict)

    created_date = DateTimeField(default=datetime.utcnow)
    updated_date = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'ingredients',
        'indexes': [
            'name',
            'category',
            'public_id'
        ],
        'ordering': ['name']
    }

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.updated_date = datetime.utcnow()
        return super(Ingredient, self).save(*args, **kwargs)

    def get_nutrition_for_grams(self, grams):
        multiplier = float(grams) / 100
        return {
            'calories': round(float(self.calories) * multiplier, 1),
            'protein': round(float(self.protein) * multiplier, 1),
            'carbs': round(float(self.carbs) * multiplier, 1),
            'fat': round(float(self.fat) * multiplier, 1),
            'fiber': round(float(self.fiber) * multiplier, 1),
            'sugar': round(float(self.sugar) * multiplier, 1),
            'sodium': round(float(self.sodium) * multiplier, 1),
        }

    def convert_to_grams(self, quantity, unit):
        if unit.lower() in ['g', 'gram', 'grams']:
            return float(quantity)

        unit_lower = unit.lower()
        if unit_lower in self.conversions:
            return float(quantity) * float(self.conversions[unit_lower])

        raise ValueError(f"No conversion found for {self.name} in {unit}")
