from django.db import models
from uuid import uuid4
from users.models import User
from django.conf import settings
from django.db.models import Q, F

# Create your models here.


class UserFowllows(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        relatedi_name="following_edges"
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
    recipe_id = models.PositiveBigIntegerField()
    date_added = models.DateTimeField(auto_now_add=True)
    tried_by = models.ForeignKey(
        User,  # Changed from string reference to direct class reference
        on_delete=models.CASCADE,
        related_name='tried_recipes'
    )

    def __str__(self):
        # type: ignore
        return f"{self.public_id} recipe tried by {self.tried_by.username}"

    class Meta:
        unique_together = ('tried_by', 'recipe_id')
        db_table = 'tried_recipes'
        verbose_name = 'Tried Recipe'
        verbose_name_plural = 'Tried Recipes'
        ordering = ['-date_added']  # Most recent first by default
