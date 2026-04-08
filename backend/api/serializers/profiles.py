from rest_framework import serializers
from profiles.models import UserProfile
from recipes.services.feed import ALLOWED_DIET_KEYS


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
            "daily_carbs_goal",
            "daily_fat_goal",
            "date_created",
            "date_updated",
            "bio",
            "diet_type",
            # FIXED: profil_picture -> profile_picture (typo fixed in model)
            "profile_picture",
        ]
        # Added date_updated as read_only
        read_only_fields = ["id", "date_created", "date_updated"]

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
        if value is None:
            return value
        if value < 1000 or value > 10000:
            raise serializers.ValidationError(
                "Daily calorie goal must be between 1000 and 10000"
            )
        return value

    def validate_diet_type(self, value: dict) -> dict:
        if not isinstance(value, dict):
            raise serializers.ValidationError("diet_type must be a JSON object.")

        unknown_keys = set(value.keys()) - ALLOWED_DIET_KEYS
        if unknown_keys:
            raise serializers.ValidationError(
                f"Unknown dietary preference keys: {sorted(unknown_keys)}. "
                f"Allowed keys: {sorted(ALLOWED_DIET_KEYS)}."
            )

        non_bool_keys = [k for k, v in value.items() if not isinstance(v, bool)]
        if non_bool_keys:
            raise serializers.ValidationError(
                f"Values for dietary preferences must be boolean. "
                f"Invalid keys: {sorted(non_bool_keys)}."
            )

        return value

    def validate_daily_protein_goal(self, value):
        if value is None:
            return value
        if value < 20 or value > 500:
            raise serializers.ValidationError(
                "Daily protein goal must be between 20 and 500 grams"
            )
        return value

    def validate_daily_carbs_goal(self, value):
        if value is None:
            return value
        if value < 50 or value > 800:
            raise serializers.ValidationError(
                "Daily carbohydrate goal must be between 50 and 800 grams"
            )
        return value

    def validate_daily_fat_goal(self, value):
        if value is None:
            return value
        if value < 20 or value > 300:
            raise serializers.ValidationError(
                "Daily fat goal must be between 20 and 300 grams"
            )
        return value
