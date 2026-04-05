"""
Signal handlers for the recipes app.
"""
import logging

from django.db.models.signals import post_delete
from django.dispatch import receiver

from recipes.models import Recipe
from recipes.services.storage import delete_recipe_images

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=Recipe)
def cleanup_recipe_images(sender: type, instance: Recipe, **kwargs: object) -> None:
    """Delete recipe images from Supabase Storage when a recipe is deleted."""
    delete_recipe_images(instance)
