from django.db.models import QuerySet
from django.contrib.auth import login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from users.models import User
from typing import Optional

from social.models import TriedRecipe
from api.serializers.users import (
    UserRegistrationSerializer,
    UserLoginSerializer, PasswordChangeConfirmSerializer,
    PasswordChangeSerializer, PasswordChangeRequestSerializer,
    CurrentUserSerializer, UserSerializer
)
from api.serializers.recipes import TriedRecipeSerializer

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


class UserPasswordChangeRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']  # type: ignore
            user = User.objects.get(email=email)

            # Generate password reset token
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password-confirm?token={token}&user_id={user.public_id}"

            send_mail(
                subject='NutriChoice - Password Reset Request',
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

            return Response({
                'message': 'Password reset email sent',
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            token = serializer.validated_data['token']  # type: ignore
            new_password = serializer.validated_data['new_password']
            user_id = serializer.validated_data['user_id']

            try:
                user = User.objects.get(public_id=user_id)

                # Verify token
                if default_token_generator.check_token(user, token):
                    user.set_password(new_password)
                    user.save()

                    # Invalidate all existing tokens
                    Token.objects.filter(user=user).delete()  # type: ignore

                    return Response({'message': 'Password reset successful'})
                else:
                    return Response(
                        {'error': 'Invalid or expired token'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except User.DoesNotExist:  # type: ignore
                return Response(
                    {'error': 'Invalid user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
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
