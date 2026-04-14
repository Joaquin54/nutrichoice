import logging
from typing import Optional

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import QuerySet
from rest_framework import viewsets, status, generics
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from api.serializers.recipes import TriedRecipeSerializer
from api.serializers.users import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    PasswordChangeConfirmSerializer,
    PasswordChangeSerializer,
    PasswordChangeRequestSerializer,
    CurrentUserSerializer,
    UserSerializer,
    CompleteOnboardingSerializer,
)
from profiles.models import UserProfile
from social.models import TriedRecipe
from users.models import User

logger = logging.getLogger(__name__)

# Create your views here.


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']  # type: ignore
            token, created = Token.objects.get_or_create(
                user=user)  # type: ignore
            login(request, user)
            return Response({
                'token': token.key,
                'user': CurrentUserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        try:
            # Delete the user's token
            request.user.auth_token.delete()
        except:
            pass
        logout(request)
        return Response({'message': 'Successfully logged out'})


_RESET_GENERIC_RESPONSE = "If an account with that email exists, a password reset link has been sent."


class UserPasswordChangeRequestView(APIView):
    """
    POST /api/auth/password-reset-request/

    Accepts an email address and sends a password reset email via Postmark
    (through django-anymail) if that address belongs to a registered user.
    Open to unauthenticated users so that logged-out users can recover their
    accounts.

    Flow:
      1. Validate the email field format (serializer, no DB lookup).
      2. Attempt a DB lookup — silently skip the send if not found.
      3. Generate a time-limited, one-time token using Django's
         default_token_generator (HMAC-based, tied to the user's password hash
         and last_login — invalidated automatically on password change).
      4. Build a reset link pointing to the frontend confirm page, embedding
         the token and the user's public_id as query params.
      5. Send a plain-text email via send_mail, routed through the Anymail
         Postmark backend configured in settings.py.
      6. Always return the same generic success message regardless of outcome
         to prevent email-enumeration attacks.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_request"

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            # Return the same generic message even for malformed payloads —
            # we do not want to distinguish "bad email format" from "not found".
            return Response({"message": _RESET_GENERIC_RESPONSE})

        email: str = serializer.validated_data["email"]  # type: ignore[index]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": _RESET_GENERIC_RESPONSE})

        # Generate a one-time, time-limited reset token bound to the user's
        # current password hash. It becomes invalid once the password changes.
        token = default_token_generator.make_token(user)

        # Build the frontend URL the user clicks in the email.
        # rstrip("/") guards against a trailing slash in FRONTEND_URL producing
        # a double-slash in the emailed link.
        base_url = settings.FRONTEND_URL.rstrip("/")
        reset_link = f"{base_url}/reset-password/confirm?token={token}&user_id={user.public_id}"

        try:
            send_mail(
                subject="NutriChoice - Password Reset Request",
                message=(
                    f"Hi {user.first_name},\n\n"
                    f"You requested a password reset for your NutriChoice account.\n\n"
                    f"Click the link below to reset your password:\n"
                    f"{reset_link}\n\n"
                    f"If you did not request this, you can safely ignore this email.\n\n"
                    f"- The NutriChoice Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            # Log the failure for ops visibility but keep the response generic
            # so a Postmark outage does not reveal whether the address exists.
            logger.exception("Failed to send password reset email to %s", email)

        return Response({"message": _RESET_GENERIC_RESPONSE})


class UserPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeSerializer(
            data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(
                serializer.validated_data['new_password'])  # type: ignore
            user.save()

            # Invalidate all existing tokens
            Token.objects.filter(user=user).delete()  # type: ignore

            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPasswordChangeConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token: str = serializer.validated_data['token']  # type: ignore[index]
            new_password: str = serializer.validated_data['new_password']  # type: ignore[index]
            user_id = serializer.validated_data['user_id']  # type: ignore[index]

            # Use a single generic error for both unknown user and invalid token
            # to prevent user-enumeration through the confirm endpoint.
            _token_error = Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

            try:
                user = User.objects.get(public_id=user_id)
            except User.DoesNotExist:  # type: ignore[misc]
                return _token_error

            if not default_token_generator.check_token(user, token):
                return _token_error

            user.set_password(new_password)
            user.save()

            # Invalidate all existing DRF auth tokens so the user must
            # log in again after the reset, closing any hijacked sessions.
            Token.objects.filter(user=user).delete()  # type: ignore[misc]

            return Response({'message': 'Password reset successful'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserTokenRefreshView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        # Delete old token and create new one
        try:
            request.user.auth_token.delete()
        except:
            pass

        token = Token.objects.create(user=request.user)  # type: ignore
        return Response({
            'token': token.key,
            'user': CurrentUserSerializer(request.user).data
        })


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)


class CompleteOnboardingView(APIView):
    """
    POST /api/auth/complete-onboarding/

    Persists the user's onboarding preferences (diet_type, allergies) and
    marks their profile as onboarded. Idempotent — calling again updates
    preferences without error. Returns a fresh CurrentUser snapshot so the
    frontend can replace its stored user object in a single round-trip.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = CompleteOnboardingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        diet_type: dict | None = serializer.validated_data['diet_type']
        allergies: list = serializer.validated_data['allergies']

        with transaction.atomic():
            profile, _ = UserProfile.objects.select_for_update().get_or_create(
                user=request.user  # type: ignore[misc]
            )
            profile.diet_type = diet_type  # None persists as SQL NULL (skipped); {} persists as empty JSON object (cleared)
            profile.allergies = allergies
            profile.is_onboarded = True
            profile.save(update_fields=['diet_type', 'allergies', 'is_onboarded', 'date_updated'])

        return Response(CurrentUserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling user operations.
    Provides CRUD operations for User model.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'public_id'  # Use public_id instead of pk for lookups

    def get_queryset(self) -> QuerySet[User]:  # type: ignore
        """
        Optionally restricts the returned users by filtering against
        query parameters in the URL.
        """
        queryset = User.objects.all()
        username: Optional[str] = self.request.query_params.get(
            'username', None)  # type: ignore

        if username is not None:
            queryset = queryset.filter(username__icontains=username)

        return queryset

    @action(detail=True, methods=['get'])
    def tried_recipes(self, request: Request, public_id: Optional[str] = None) -> Response:
        """
        Returns all recipes tried by this user
        """
        user = self.get_object()
        tried_recipes = TriedRecipe.objects.filter(tried_by=user)
        serializer = TriedRecipeSerializer(tried_recipes, many=True)
        return Response(serializer.data)
