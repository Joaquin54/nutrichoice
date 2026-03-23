from rest_framework import serializers
from django.core.validators import MaxValueValidator, MinValueValidator

from social.models import RecipeReview, UserFollow, UserBlock


class AuthorSummarySerializer(serializers.Serializer):
    public_id = serializers.UUIDField()
    username = serializers.CharField()
    profile_picture = serializers.CharField(
        source="profile.profile_picture",
        allow_blank=True,
        default="",
    )


class RecipeReviewWriteSerializer(serializers.ModelSerializer):
    text = serializers.CharField(max_length=250, allow_blank=True)
    rating = serializers.IntegerField(
        required=True,
        allow_null=False,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )

    class Meta:
        model = RecipeReview
        fields = ["recipe", "text", "rating"]


class RecipeReviewReadSerializer(serializers.ModelSerializer):
    rating = serializers.IntegerField(read_only=True)
    text = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    author = AuthorSummarySerializer(read_only=True)

    class Meta:
        model = RecipeReview
        fields = ["id", "recipe", "author", "text", "rating", "created_at"]
        read_only_fields = fields


class UserFollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFollow
        fields = ["id", "follower", "followee", "created_at"]
        read_only_fields = ["id", "follower", "created_at"]


class UserBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBlock
        fields = ["id", "blocker", "blocked", "created_at"]
        read_only_fields = ["id", "blocker", "created_at"]
