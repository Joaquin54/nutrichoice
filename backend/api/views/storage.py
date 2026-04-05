"""
API views for Supabase Storage signed-URL generation and URL persistence.

All Supabase I/O is delegated to ``recipes.services.storage``.
"""
from __future__ import annotations

import logging
import re

from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from api.serializers.storage import SaveUrlRequestSerializer, SignedUrlRequestSerializer
from recipes.models import Recipe
from recipes.services import storage as storage_service

logger = logging.getLogger(__name__)

# Regex patterns for validating storage path ownership.
_RECIPE_PATH_RE = re.compile(r"^(\d+)/(\d+)/([012])\.webp$")
_PROFILE_PATH_RE = re.compile(r"^(\d+)/avatar\.webp$")

# Maps image_index integer to Recipe field name.
FIELD_MAP: dict[int, str] = {0: "image_1", 1: "image_2", 2: "image_3"}


def _extract_old_path(url: str, bucket: str) -> str:
    """Return the storage path portion from a public URL for ``bucket``."""
    marker = f"/storage/v1/object/public/{bucket}/"
    idx = url.find(marker)
    if idx == -1:
        return ""
    return url[idx + len(marker):]


class SignedUrlView(APIView):
    """
    POST /api/storage/signed-url/

    Returns a Supabase signed upload URL for a recipe image or profile avatar.
    The caller uploads directly to Supabase, then calls SaveUrlView.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = SignedUrlRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        bucket: str = data["bucket"]

        if bucket == "recipe_images":
            path = self._build_recipe_path(request, data)
        else:
            path = f"{request.user.pk}/avatar.webp"

        result = storage_service.generate_signed_upload_url(bucket, path)
        return Response(result, status=status.HTTP_200_OK)

    def _build_recipe_path(self, request: Request, data: dict) -> str:
        """Validate recipe ownership and return the storage path for a recipe image."""
        recipe_id: int = data["recipe_id"]
        image_index: int = data["image_index"]

        try:
            recipe = Recipe.objects.only("pk", "creator_id").get(pk=recipe_id)
        except Recipe.DoesNotExist:
            raise NotFound(detail="Recipe not found.")

        if recipe.creator_id != request.user.pk:
            raise PermissionDenied(detail="You do not own this recipe.")

        return f"{request.user.pk}/{recipe_id}/{image_index}.webp"


class SaveUrlView(APIView):
    """
    POST /api/storage/save-url/

    Persists the public URL of an already-uploaded file onto the Recipe or
    UserProfile record. Deletes any previously stored file for that slot.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = SaveUrlRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        bucket: str = data["bucket"]
        path: str = data["path"]

        if bucket == "recipe_images":
            return self._save_recipe_image(request, bucket, path)
        return self._save_profile_image(request, bucket, path)

    def _save_recipe_image(self, request: Request, bucket: str, path: str) -> Response:
        """Persist a recipe image URL and clean up any previous image in that slot."""
        match = _RECIPE_PATH_RE.match(path)
        if not match or match.group(1) != str(request.user.pk):
            raise PermissionDenied(detail="Path does not belong to your account.")

        recipe_id = int(match.group(2))
        image_index = int(match.group(3))
        field_name = FIELD_MAP[image_index]

        try:
            recipe = Recipe.objects.only("pk", "creator_id", *FIELD_MAP.values()).get(pk=recipe_id)
        except Recipe.DoesNotExist:
            raise NotFound(detail="Recipe not found.")

        if recipe.creator_id != request.user.pk:
            raise PermissionDenied(detail="You do not own this recipe.")

        # Best-effort deletion of the previous image in this slot.
        old_url: str = getattr(recipe, field_name)
        if old_url:
            old_path = _extract_old_path(old_url, bucket)
            if old_path:
                storage_service.delete_file(bucket, old_path)

        public_url = storage_service.get_public_url(bucket, path)
        Recipe.objects.filter(pk=recipe_id).update(**{field_name: public_url})

        # Reload only the image fields for the response.
        recipe.refresh_from_db(fields=list(FIELD_MAP.values()))
        return Response(
            {
                "recipe_id": recipe_id,
                "image_1": recipe.image_1,
                "image_2": recipe.image_2,
                "image_3": recipe.image_3,
            },
            status=status.HTTP_200_OK,
        )

    def _save_profile_image(self, request: Request, bucket: str, path: str) -> Response:
        """Persist a profile avatar URL onto the requesting user's profile."""
        match = _PROFILE_PATH_RE.match(path)
        if not match or match.group(1) != str(request.user.pk):
            raise PermissionDenied(detail="Path does not belong to your account.")

        public_url = storage_service.get_public_url(bucket, path)
        profile = request.user.profile  # type: ignore[attr-defined]
        profile.profile_picture = public_url
        profile.save(update_fields=["profile_picture"])

        return Response({"profile_picture": public_url}, status=status.HTTP_200_OK)
