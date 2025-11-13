from rest_framework import fields, serializers
from .models import TriedRecipe, User, User_Profile
from .models_mongo import Ingredient, RecipeIngredientEmbedded

# For MongoDB models (Recipe, Ingredient, SavedRecipe)
from rest_framework_mongoengine import serializers as mongo_serializers


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

        read_only_fields = ['public_id', 'date_created']

    def validate_username(self, value):
        if len(value < 3):
            raise serializers.ValidationError(
                "Username must be longer than 4 characters")
        if len(value > 24):
            raise serializers.ValidationError(
                "Username must be 24 characters or shorter")

        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")

        forbidden_words = ["admin", "root", "system", "nutrichoice"]
        if value.lower() in forbidden_words:
            raise serializers.ValidationError("Username not allowed")

class TriedRecipeSerializer(serializers.ModelSerializer):
    model = TriedRecipe
    fields = [
        "public_id",
        "date_added",
        "tried_by",
    ]

    read_only_fields = ['public_id', 'date_added']


    #Object level validation, data is dict which holds all fields for a given model
    #See https://www.django-rest-framework.org/api-guide/serializers/#object-level-validation
    def valide(self, data):
        public_id = data['public_id']
        tried_by = data['tried_by']

        if(TriedRecipe.objects.filter(public_id=public_id, tried_by=tried_by)):
            raise serializers.ValidationError("Recipe already tried by user this user")


#    def validate_triedrecipe(self, value):
#        if TriedRecipe.objects.filter(public_id=public_id, tried_by=tried_by).exists():
#            raise serializers.ValidationError(
#                "Recipe already tried by user this user")
        

#All serializers below added by Pedro (hopefully they work)

class UserProfileSerializers(serializers.ModelSerializer):
    class Meta:
        #Postgree model user profile
        model = User_Profile
        #Data fields of the postgree table/model
        fields = [
            "id", 
            "user", 
            "daily_calorie_goal", 
            "daily_protein_goal",
            "date_created",
            "date_updated",
            "bio",
            "diet_type",
            "profil_picture" #Typo here is copied from model
                  ]
        
        read_only_fields = ["id", "date_created"]

        def validate_id(self, value):
            if User_Profile.objects.filter(id=value).exists():
                raise serializers.ValidationError(
                    "Another user in the system has identical ID"
                )
            
        #Ensure one user does not have multiple profiles
        def validate_user(self, value):
            if User_Profile.objects.filter(user=value).exists():
                raise serializers.ValidationError(
                    "User already has a profile created"
                )



class IngredientSerializer(mongo_serializers.DocumentSerializer):
    class meta:
        model = Ingredient
        fields = ["public_id", 
                "name",
                "category",
                "calories",
                "protein"
                "carbs",
                "fat",
                "fiber",
                "sugar",
                "sodium",
                "conversions",
                "created_date",
                "updated_date"
                ]
    
        read_only_fields = ["public_id", "created_date", "updated_date"]

#Not sure what this serializer accomplishes
class IngredientListSerializer(mongo_serializers.DocumentSerializer):

    class meta:
        model = Ingredient
        fields = ["public_id",
                  "name",
                  "category",
                  "calories",
                  "protein",
                  "carbs",
                  "fat"
                  ]
        read_only_fields = ["public_id",]

class RecipeIngredientEmbeddedSerializer(mongo_serializers.DocumentSerializer):
    class meta:
        model = RecipeIngredientEmbedded
        fields = ["ingredient_id",
                  "ingredient_name",
                  "quantity_grams",
                  "display_quantity",
                  "display_unit",
                  "preparation_notes",
                  "order"
                  ]

