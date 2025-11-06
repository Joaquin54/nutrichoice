from rest_framework import fields, serializers
from .models import TriedRecipe, User


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

    def validate_triedrecipe(self, value):
        if TriedRecipe.objects.filter(public_id=public_id, tried_by=tried_by).exists():
            raise serializers.ValidationError(
                "Recipe already tried by user this user")
