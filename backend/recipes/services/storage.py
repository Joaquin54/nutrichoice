"""Supabase Storage I/O service — all storage ops are centralised here."""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import TYPE_CHECKING

from django.conf import settings
from supabase import Client, create_client

if TYPE_CHECKING:
    from recipes.models import Recipe

logger = logging.getLogger(__name__)

# Path segment that separates SUPABASE_URL from bucket+object in public URLs.
_PUBLIC_PREFIX = "/storage/v1/object/public/"


@lru_cache(maxsize=1)
def _get_client() -> Client:
    """Return a lazily-initialised Supabase client (singleton via lru_cache)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def generate_signed_upload_url(bucket: str, path: str) -> dict[str, str]:
    """
    Request a signed upload URL from Supabase Storage.

    Returns dict with keys: ``signed_url``, ``path``, ``token``.
    Raises the Supabase exception on failure — callers are responsible for handling it.
    """
    result: dict[str, str] = _get_client().storage.from_(bucket).create_signed_upload_url(path)
    return result


def upload_file(
    bucket: str,
    path: str,
    content: bytes,
    content_type: str = "image/webp",
) -> None:
    """Upload raw bytes to Supabase Storage, overwriting any existing object at ``path``."""
    _get_client().storage.from_(bucket).upload(
        path,
        content,
        {"content-type": content_type, "upsert": "true"},
    )


def get_public_url(bucket: str, path: str) -> str:
    """Construct the public object URL without a network call."""
    base = settings.SUPABASE_URL.rstrip("/")
    return f"{base}{_PUBLIC_PREFIX}{bucket}/{path}"


def delete_file(bucket: str, path: str) -> None:
    """
    Delete a single file from Supabase Storage (best-effort).

    Exceptions are logged as WARNING and swallowed — a failed cleanup must
    never block the primary request.
    """
    try:
        _get_client().storage.from_(bucket).remove([path])
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Failed to delete storage object bucket=%r path=%r: %s",
            bucket, path, exc,
        )


def delete_recipe_images(recipe: "Recipe") -> None:
    """Delete all non-empty image files for ``recipe`` from Supabase Storage."""
    bucket = "recipe_images"
    marker = f"{_PUBLIC_PREFIX}{bucket}/"
    for url in (recipe.image_1, recipe.image_2, recipe.image_3):
        if not url:
            continue
        idx = url.find(marker)
        if idx == -1:
            logger.warning("Could not extract storage path from URL: %s", url)
            continue
        delete_file(bucket, url[idx + len(marker):])
