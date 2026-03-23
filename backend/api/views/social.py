from django.db import IntegrityError
from django.db.models import QuerySet
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from api.serializers.social import UserBlockSerializer, UserFollowSerializer
from social.models import UserBlock, UserFollow


class UserFollowViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing who the current user follows.

    GET    /api/follows/       — list everyone the current user follows
    POST   /api/follows/       — follow a user  (body: {"followee": <user_pk>})
    DELETE /api/follows/<id>/  — unfollow (delete the follow edge by its id)

    PUT/PATCH are disabled — a follow edge has no mutable fields.
    """

    serializer_class = UserFollowSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self) -> QuerySet[UserFollow]:
        return UserFollow.objects.filter(follower=self.request.user)

    def perform_create(self, serializer: UserFollowSerializer) -> None:
        try:
            serializer.save(follower=self.request.user)
        except IntegrityError:
            raise DRFValidationError("You are already following this user.")


class UserBlockViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing who the current user has blocked.

    GET    /api/blocks/       — list everyone the current user has blocked
    POST   /api/blocks/       — block a user  (body: {"blocked": <user_pk>})
    DELETE /api/blocks/<id>/  — unblock (delete the block edge by its id)

    PUT/PATCH are disabled — a block edge has no mutable fields.
    """

    serializer_class = UserBlockSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self) -> QuerySet[UserBlock]:
        return UserBlock.objects.filter(blocker=self.request.user)

    def perform_create(self, serializer: UserBlockSerializer) -> None:
        try:
            serializer.save(blocker=self.request.user)
        except IntegrityError:
            raise DRFValidationError("You have already blocked this user.")
