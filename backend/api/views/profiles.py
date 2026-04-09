from django.db.models import QuerySet
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from profiles.models import UserProfile
from api.serializers.profiles import UserProfileSerializer


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling user profile operations.
    Provides CRUD operations for UserProfile model.
    """
    queryset = UserProfile.objects.all()  # type: ignore
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> QuerySet[UserProfile]:  # type: ignore
        """
        Restrict queryset to the current user's profile only
        """
        return UserProfile.objects.filter(user=self.request.user)  # type: ignore

    def perform_create(self, serializer: UserProfileSerializer) -> None:
        """
        Associate the profile with the current user when creating
        """
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request: Request) -> Response:
        """
        Get or update the current user's profile
        """
        try:
            profile = UserProfile.objects.get(
                user=request.user)  # type: ignore
        except UserProfile.DoesNotExist:  # type: ignore
            # Create profile if it doesn't exist
            profile = UserProfile.objects.create(
                user=request.user)  # type: ignore

        # PATCH {"diet_type": null} clears the preference to NULL via the serializer's validate_diet_type
        if request.method == 'PATCH':
            serializer = UserProfileSerializer(
                profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
        else:
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
