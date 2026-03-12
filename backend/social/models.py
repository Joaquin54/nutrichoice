# from re import A
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from uuid import uuid4

from users.models import User
from django.conf import settings
from django.db.models import Q, F
from recipes.models import Recipe

# Create your models here.


class RecipeReview(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="written_recipe_reviews"
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="recipe_reviews"
    )
    text = models.CharField(max_length=250)
    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["author", "recipe"],
                name="uq_recipereview_author_recipe"
            )
        ]
        db_table = 'recipe_reviews'
        verbose_name = 'Recipe Review'
        verbose_name_plural = 'Recipe Reviews'
        ordering = ['-created_at']  # Most recent first by default


class PostRecipe(models.Model):
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="posted_recipe"
    )
    privacy = models.BooleanField(default=True)  # type: ignore
    date_created = models.DateTimeField(auto_now_add=True)


class UserBlock(models.Model):
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocking_edges"
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocked_edges"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_block"

        constraints = [
            models.UniqueConstraint(
                fields=["blocker", "blocked"],
                name="uq_userblock_blocker_blocked"
            ),
            models.CheckConstraint(
                check=~Q(blocker=F("blocked")),
                name="ck_userblock_no_self_block",
            ),
        ]

        indexes = [
            models.Index(fields=["blocker"], name="ix_userblock_blocker"),
            models.Index(fields=["blocked"], name="ix_userblock_blocked"),
            models.Index(fields=["created_at"], name="ix_userblock_created_at")
        ]

    def __str__(self) -> str:
        return f"{self.blocker_id} blocked {self.blocked_id}"  # type: ignore


class UserFollow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following_edges"
    )
    followee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="follower_edges"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_follows"

        # Prevent duplicates: one follow edge per (follower, followee)
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "followee"],
                name="uq_userfollow_follower_followee"
            ),
            # Prevent self-follow
            models.CheckConstraint(
                check=~Q(follower=F("followee")),
                name="ck_userfollow_no_self_follow",
            )
        ]

        indexes = [
            models.Index(fields=["follower"], name="ix_userfollow_follower"),
            models.Index(fields=["followee"], name="ix_userfollow_followee"),
            models.Index(fields=["created_at"],
                         name="ix_userfollow_created_at")
        ]

    def __str__(self) -> str:
        return f"{self.follower_id} -> {self.followee_id}"  # type: ignore


class TriedRecipe(models.Model):
    """
    Tracks recipes that users have tried.
    """
    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(
        default=uuid4,
        editable=False,
        unique=True,
    )
    recipe = models.ForeignKey(
        "recipes.Recipe",
        on_delete=models.CASCADE,
        related_name="tried_entries",
        null=True,
        blank=True
    )
    date_added = models.DateTimeField(auto_now_add=True)
    tried_by = models.ForeignKey(
        User,  # Changed from string reference to direct class reference
        on_delete=models.CASCADE,
        related_name='tried_recipes'
    )

    def __str__(self):
        return f"{self.public_id} recipe tried by {self.tried_by.username}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["tried_by", "recipe"],
                name="uq_triedrecipe_user_recipe"
            )
        ]
        db_table = 'tried_recipes'
        verbose_name = 'Tried Recipe'
        verbose_name_plural = 'Tried Recipes'
        ordering = ['-date_added']  # Most recent first by default
