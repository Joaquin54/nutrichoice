from django.db import models
from uuid import uuid4
from users.models import User

# Create your models here.
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
        return f"{self.public_id} recipe tried by {self.tried_by.username}" # type: ignore

    class Meta:
        unique_together = ('tried_by', 'recipe_id')
        db_table = 'tried_recipes'
        verbose_name = 'Tried Recipe'
        verbose_name_plural = 'Tried Recipes'
        ordering = ['-date_added']  # Most recent first by default
