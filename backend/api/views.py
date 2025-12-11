from django.shortcuts import render
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
from typing import Optional
from .models import User, TriedRecipe
from .serializers import (
    UserSerializer, TriedRecipeSerializer, UserRegistrationSerializer,
    UserLoginSerializer, PasswordChangeRequestSerializer,
    PasswordChangeSerializer, PasswordChangeConfirmSerializer,
    CurrentUserSerializer
)


class HealthView(APIView):
    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})

# May change later to APIView for custom logic
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
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
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)

            # Generate password reset token
            token = default_token_generator.make_token(user)

            # In a real app, you'd send this via email
            # For now, we'll return it in the response (NOT for production)
            reset_link = f"http://localhost:3000/reset-password?token={token}&user_id={user.public_id}"

            # TODO: Send actual email in production
            # send_mail(
            #     'Password Reset Request',
            #     f'Click here to reset your password: {reset_link}',
            #     settings.DEFAULT_FROM_EMAIL,
            #     [email],
            #     fail_silently=False,
            # )

            return Response({
                'message': 'Password reset email sent',
                'reset_link': reset_link  # Remove this in production
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            # Invalidate all existing tokens
            Token.objects.filter(user=user).delete()

            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPasswordChangeConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']

            # Get user from token (simplified - in production use proper token validation)
            try:
                user_id = request.data.get('user_id')
                user = User.objects.get(public_id=user_id)

                # Verify token
                if default_token_generator.check_token(user, token):
                    user.set_password(new_password)
                    user.save()

                    # Invalidate all existing tokens
                    Token.objects.filter(user=user).delete()

                    return Response({'message': 'Password reset successful'})
                else:
                    return Response(
                        {'error': 'Invalid or expired token'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except User.DoesNotExist:
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

        token = Token.objects.create(user=request.user)
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

    def get_queryset(self) -> QuerySet[User]:
        """
        Optionally restricts the returned users by filtering against
        query parameters in the URL.
        """
        queryset = User.objects.all()
        username: Optional[str] = self.request.query_params.get(
            'username', None)
        diet_type: Optional[str] = self.request.query_params.get(
            'diet_type', None)

        if username is not None:
            queryset = queryset.filter(username__icontains=username)
        if diet_type is not None:
            queryset = queryset.filter(diet_type=diet_type)

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


class TriedRecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling tried recipes operations.
    Provides CRUD operations for TriedRecipe model.
    """
    queryset = TriedRecipe.objects.all()
    serializer_class = TriedRecipeSerializer
    lookup_field = 'public_id'

    def get_queryset(self) -> QuerySet[TriedRecipe]:
        """
        Optionally restricts the returned tried recipes by filtering against
        query parameters in the URL.
        """
        queryset = TriedRecipe.objects.all()
        user_id: Optional[str] = self.request.query_params.get('user_id', None)
        recipe_id: Optional[str] = self.request.query_params.get(
            'recipe_id', None)

        if user_id is not None:
            queryset = queryset.filter(tried_by__public_id=user_id)
        if recipe_id is not None:
            queryset = queryset.filter(recipe_id=recipe_id)

        return queryset

    def perform_create(self, serializer: TriedRecipeSerializer) -> None:
        """
        Associate the tried recipe with the current user when creating
        """
        serializer.save(tried_by=self.request.user)

    @action(detail=False, methods=['get'])
    def most_tried(self, request: Request) -> Response:
        """
        Returns the most tried recipes
        """
        from django.db.models import Count
        most_tried = (TriedRecipe.objects
                      .values('recipe_id')
                      .annotate(try_count=Count('recipe_id'))
                      .order_by('-try_count')[:10])
        return Response(most_tried)
