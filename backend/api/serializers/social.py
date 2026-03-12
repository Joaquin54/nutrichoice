from rest_framework import serializers
from django.core.validators import MaxValueValidator, MinValueValidator
# from nutrition.models import


class AuthorSummarySerializer(serializers.Serializer):
    public_id = serializers.UUIDField()
    username = serializers.CharField()
    profile_picture = serializers.CharField(allow_blank=True)


class RecipeReviewWriteSerializer(serializers.ModelSerializer):
    # Text can be left blank
    text = serializers.CharField(max_length=250, allow_blank=True)
    # Rating is required
    rating = serializers.IntegerField(
        allow_blank=False,
        allow_null=False,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )


class RecipeReviewReadSerializer(serializers.ModelSerializer):
    rating = serializers.IntegerField(read_only=True)
    text = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    author = AuthorSummarySerializer(read_only=True)


class UserFollowSerializer(serializers.Serializer):
    follower_id = serializers.IntegerField()
    followee_id = serializers.IntegerField()
    created_at = serializers.DateTimeField()


class UserBlockSerializer(serializers.Serializer):
    blocker_id = serializers.IntegerField()
    blocked_id = serializers.IntegerField()
    created_at = serializers.DateTimeField()
