from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from users.models import User
from profiles.models import UserProfile
from api.serializers.profiles import UserProfileSerializer


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, validators=[validate_password])
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

    @transaction.atomic
    def create(self, validated_data: dict) -> User:
        validated_data.pop('password_confirm', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # Auto-create UserProfile — runs inside the same transaction as create_user
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
            raise serializers.ValidationError(
                'Must include username and password')


class PasswordChangeRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "No user found with this email address")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password])
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
    user_id = serializers.UUIDField()
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_user_id(self, value):
        if not User.objects.filter(public_id=value).exists():
            raise serializers.ValidationError("Invalid user")
        return value

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


class CompleteOnboardingSerializer(serializers.Serializer):
    """
    Validates the payload for POST /api/auth/complete-onboarding/.

    diet_type keys are validated against the same allowed set enforced by
    UserProfileSerializer so both paths remain consistent.

    Accepts diet_type: null to signal "no dietary preference provided" — this
    is the canonical skipped-onboarding state and persists as SQL NULL on the
    UserProfile row.
    """
    diet_type = serializers.JSONField(default=None, allow_null=True)
    allergies = serializers.ListField(
        child=serializers.CharField(max_length=64),
        max_length=50,
        default=list,
    )

    def validate_diet_type(self, value: dict | None) -> dict | None:
        # Delegate to the profile serializer's validator for consistency
        return UserProfileSerializer().validate_diet_type(value)

    def validate_allergies(self, value: list) -> list:
        # Delegate to the profile serializer's validator for consistency
        return UserProfileSerializer().validate_allergies(value)


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
