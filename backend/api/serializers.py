from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from models import TriedRecipe, User, UserProfile  # Updated: UserProfile not User_Profile
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

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "public_id",
            "username",
            "last_name",
            "first_name",
            "email",
            "password",
            "password_confirm"
        ]
        read_only_fields = ["public_id"]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # Auto-create UserProfile
        UserProfile.objects.create(user=user)
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')


class PasswordChangeRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class PasswordChangeConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs


class CurrentUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "public_id",
            "username",
            "first_name",
            "last_name",
            "email",
            "date_created",
            "profile"
        ]
        read_only_fields = ["public_id", "date_created"]

    def get_profile(self, obj):
        try:
            profile = obj.profile
            return UserProfileSerializer(profile).data
        except UserProfile.DoesNotExist:
            return None


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
            "email",  # Added email field (was missing, but User has it)
            "date_created",
        ]
        read_only_fields = ["public_id", "date_created"]
        # REMOVED: "diet_type" - this belongs to UserProfile, not User

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

        # uniqueness check
        # ADAPTED: Need to exclude current instance during updates
        instance_id = self.instance.id if self.instance else None
        if User.objects.filter(username=value).exclude(id=instance_id).exists():
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
            "recipe_id",  # ADDED: This was missing but is required in the model
            "date_added",
            "tried_by",
        ]
        read_only_fields = ["public_id", "date_added"]

    # Object-level validation
    # See https://www.django-rest-framework.org/api-guide/serializers/#object-level-validation
    def validate(self, data):
        # FIXED: The original validation was checking public_id which doesn't make sense
        # The unique_together constraint is on (tried_by, recipe_id)
        recipe_id = data.get("recipe_id")
        tried_by = data.get("tried_by")

        # Exclude current instance if updating
        queryset = TriedRecipe.objects.filter(recipe_id=recipe_id, tried_by=tried_by)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Recipe already tried by this user"
            )

        return data


class UserProfileSerializer(serializers.ModelSerializer):
    # RENAMED: UserProfileSerializers -> UserProfileSerializer (removed plural, follows convention)

    class Meta:
        # Updated model reference
        model = UserProfile  # Changed from User_Profile

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
            "profile_picture",  # FIXED: profil_picture -> profile_picture (typo fixed in model)
        ]
        read_only_fields = ["id", "date_created", "date_updated"]  # Added date_updated as read_only

    # REMOVED: validate_id method
    # The id field is auto-generated and read-only, so this validation is unnecessary
    # Django guarantees id uniqueness automatically

    # Ensure one user does not have multiple profiles
    def validate_user(self, value):
        # ADAPTED: Need to exclude current instance during updates
        queryset = UserProfile.objects.filter(user=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "User already has a profile created"
            )
        return value

    # OPTIONAL: Add validation for calorie and protein goals
    def validate_daily_calorie_goal(self, value):
        if value < 1000 or value > 10000:
            raise serializers.ValidationError(
                "Daily calorie goal must be between 1000 and 10000"
            )
        return value

    def validate_daily_protein_goal(self, value):
        if value < 20 or value > 500:
            raise serializers.ValidationError(
                "Daily protein goal must be between 20 and 500 grams"
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


class IngredientListSerializer(DocumentSerializer):
    # This serializer provides a lighter version for list views (less fields = better performance)
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
