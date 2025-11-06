from enum import unique
from uuid import uuid4
from django.db import models


class User(models.Model):
    # Internal DB key
    id = models.BigAutoField(primary_key=True)
    # Public key for secure external ID
    public_id = models.UUIDField(
        default=uuid4,
        editable=False,
        unique=True,
    )
    username = models.CharField(max_length=24)
    first_name = models.CharField(max_length=35)
    last_name = models.CharField(max_length=35)
    email = models.EmailField(max_length=70)
    date_created = models.DateTimeField(auto_now_add=True)


def __str__(self):
    return str(self.public_id)


class User_Profile(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        'User', on_delete=models.CASCADE, related_name='user_profile')
    daily_calorie_goal = models.SmallIntegerField()
    daily_protein_goal = models.SmallIntegerField()
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField()
    bio = models.CharField(max_length=500)
    diet_type = models.JSONField()
    profil_picture = models.URLField()


class TriedRecipe(models.Model):
    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(
        default=uuid4,
        editable=False,
        unique=True,
    )
    recipe_id = models.PositiveBigIntegerField()
    date_added = models.DateTimeField(auto_now_add=True)
    tried_by = models.ForeignKey(
        'User', on_delete=models.CASCADE, related_name='tried_recipes')

    def __str__(self):
        # type: ignore
        return f"{self.public_id} recipe tried by {self.tried_by.username}"

    class Meta:
        unique_together = ('tried_by', 'recipe_id')
