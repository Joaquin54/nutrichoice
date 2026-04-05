"""
Input serializers for the storage signed-URL and save-URL endpoints.
"""
from rest_framework import serializers

# Bucket names allowed for upload operations.
RECIPE_IMAGES_BUCKET = "recipe_images"
PROFILE_IMAGES_BUCKET = "profile_picture"
ALLOWED_BUCKETS = [RECIPE_IMAGES_BUCKET, PROFILE_IMAGES_BUCKET]


class SignedUrlRequestSerializer(serializers.Serializer):
    """Validate the payload for POST /api/storage/signed-url/."""

    bucket = serializers.ChoiceField(choices=ALLOWED_BUCKETS)
    recipe_id = serializers.IntegerField(required=False)
    image_index = serializers.IntegerField(required=False, min_value=0, max_value=2)

    def validate(self, attrs: dict) -> dict:
        if attrs["bucket"] == RECIPE_IMAGES_BUCKET:
            if "recipe_id" not in attrs:
                raise serializers.ValidationError(
                    {"recipe_id": "Required for recipe images."}
                )
            if "image_index" not in attrs:
                raise serializers.ValidationError(
                    {"image_index": "Required for recipe images."}
                )
        return attrs


class SaveUrlRequestSerializer(serializers.Serializer):
    """Validate the payload for POST /api/storage/save-url/."""

    bucket = serializers.ChoiceField(choices=ALLOWED_BUCKETS)
    path = serializers.CharField(max_length=500)
