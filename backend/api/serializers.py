from rest_framework import serializers
from models import TriedRecipe, User, User_Profile
from models_mongo import (
    Ingredient,
    RecipeIngredientEmbedded,
    RecipeInstructionEmbedded,
    Recipe,
    SavedRecipe,
)

# For MongoDB models (Recipe, Ingredient, SavedRecipe)
from rest_framework_mongoengine.serializers import (
    DocumentSerializer,
    EmbeddedDocumentSerializer,
)


class UserSerializer(serializers.ModelSerializer):
    """
    Serialize user data from the User Model (model.py)
    """

    class Meta:
        model = User
        fields = [
            "public_id",  # is exposed to FE and PK remains private
            "username",
            "last_name",
            "first_name",
            "diet_type",
            "date_created",
        ]
        read_only_fields = ["public_id", "date_created"]

    def validate_username(self, value):
        # length checks
        if len(value) < 4:
            raise serializers.ValidationError(
                "Username must be longer than 4 characters"
            )
        if len(value) > 24:
            raise serializers.ValidationError(
                "Username must be 24 characters or shorter"
            )

        # uniqueness
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")

        # forbidden names
        forbidden_words = ["admin", "root", "system", "nutrichoice"]
        if value.lower() in forbidden_words:
            raise serializers.ValidationError("Username not allowed")

        return value


class TriedRecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriedRecipe
        fields = [
            "public_id",
            "date_added",
            "tried_by",
        ]
        read_only_fields = ["public_id", "date_added"]

    # Object-level validation
    # See https://www.django-rest-framework.org/api-guide/serializers/#object-level-validation
    def validate(self, data):
        public_id = data["public_id"]
        tried_by = data["tried_by"]

        if TriedRecipe.objects.filter(public_id=public_id, tried_by=tried_by).exists():
            raise serializers.ValidationError(
                "Recipe already tried by this user"
            )

        return data


class UserProfileSerializers(serializers.ModelSerializer):
    class Meta:
        # Postgres model user profile
        model = User_Profile
        # Data fields of the postgres table/model
        fields = [
            "id",
            "user",
            "daily_calorie_goal",
            "daily_protein_goal",
            "date_created",
            "date_updated",
            "bio",
            "diet_type",
            "profil_picture",  # Typo here is copied from model
        ]
        read_only_fields = ["id", "date_created"]

    def validate_id(self, value):
        if User_Profile.objects.filter(id=value).exists():
            raise serializers.ValidationError(
                "Another user in the system has identical ID"
            )
        return value

    # Ensure one user does not have multiple profiles
    def validate_user(self, value):
        if User_Profile.objects.filter(user=value).exists():
            raise serializers.ValidationError(
                "User already has a profile created"
            )
        return value


class IngredientSerializer(DocumentSerializer):
    class Meta:
        model = Ingredient
        fields = [
            "public_id",
            "name",
            "category",
            "calories",
            "protein",
            "carbs",
            "fat",
            "fiber",
            "sugar",
            "sodium",
            "conversions",
            "created_date",
            "updated_date",
        ]
        read_only_fields = ["public_id", "created_date", "updated_date"]


# Not sure what this serializer accomplishes
class IngredientListSerializer(DocumentSerializer):
    class Meta:
        model = Ingredient
        fields = [
            "public_id",
            "name",
            "category",
            "calories",
            "protein",
            "carbs",
            "fat",
        ]
        read_only_fields = ["public_id"]


class RecipeIngredientEmbeddedSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = RecipeIngredientEmbedded
        fields = [
            "ingredient_id",
            "ingredient_name",
            "quantity_grams",
            "display_quantity",
            "display_unit",
            "preparation_notes",
            "order",
        ]


class RecipeInstructionEmbeddedSerializer(EmbeddedDocumentSerializer):
    class Meta:
        model = RecipeInstructionEmbedded
        fields = [
            "step_number",
            "instruction",
            "duration_minutes",
        ]


class RecipeSerializer(DocumentSerializer):
    # nested serialization
    ingredients = RecipeIngredientEmbeddedSerializer(many=True)
    instructions = RecipeInstructionEmbeddedSerializer(many=True)

    class Meta:
        model = Recipe
        fields = [
            "public_id",
            "user_id",
            "title",
            "description",
            "image_url",
            "prep_time",
            "cook_time",
            "ingredients",  # nested
            "instructions",  # nested
            "nutrition_per_serving",
            "nutrition_total",
            "cuisine_type",
            "dietary_tags",
            "is_public",
            "date_time_created",
            "date_time_updated",
        ]
        read_only_fields = [
            "public_id",
            "nutrition_per_serving",
            "nutrition_total",
            "date_time_created",
            "date_time_updated",
        ]


class RecipeListSerializer(DocumentSerializer):
    class Meta:
        model = Recipe
        fields = [
            "public_id",
            "title",
            "description",
            "image_url",
            "prep_time",
            "cook_time",
            "cuisine_type",
            "nutrition_per_serving",
            "is_public",
        ]
        read_only_fields = ["public_id", "nutrition_per_serving"]


class SavedRecipeSerializer(DocumentSerializer):
    class Meta:
        model = SavedRecipe
        fields = [
            "public_id",
            "user_id",
            "recipe_id",
            "notes",
            "saved_date",
        ]
        read_only_fields = ["public_id", "saved_date"]
