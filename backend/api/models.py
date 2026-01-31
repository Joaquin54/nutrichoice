# from django.db import models
# from uuid import uuid4
# from django.core.exceptions import ValidationError
# from django.contrib.auth.models import AbstractUser, UserManager
# from django.db.models.base import CASCADE
# from django.db.models.fields import TextField
# from django.contrib.postgres.fields import ArrayField
#
#
# class User(AbstractUser):
#     """
#     Custom User model extending Django's AbstractUser.
#
#     Inherited fields from AbstractUser:
#     - username (already defined, max_length=150)
#     - first_name (already defined, max_length=150)
#     - last_name (already defined, max_length=150)
#     - email (already defined, max_length=254)
#     - password (already defined, handles hashing automatically)
#     - is_staff, is_active, is_superuser (for admin/permissions)
#     - last_login, date_joined (timestamps)
#
#     We override some field properties and add custom fields below.
#     """
#     # Use UserManager to get create_user method
#     objects = UserManager()
#     # Override inherited fields to match your original constraints
#     username = models.CharField(max_length=24, unique=True)
#     first_name = models.CharField(max_length=35)
#     last_name = models.CharField(max_length=35)
#     # Added unique constraint
#     email = models.EmailField(max_length=70, unique=True)
#
#     # Your custom fields
#     public_id = models.UUIDField(
#         default=uuid4,
#         editable=False,
#         unique=True,
#     )
#     date_created = models.DateTimeField(auto_now_add=True)
#
#     # Optional: Specify which field to use for login
#     # USERNAME_FIELD = 'email'  # Uncomment to allow login with email instead of username
#     # REQUIRED_FIELDS = ['username']  # Fields required when creating superuser
#
#     def __str__(self):
#         return str(self.public_id)
#
#     class Meta:
#         # Optional: customize table name
#         db_table = 'users'
#         verbose_name = 'User'
#         verbose_name_plural = 'Users'
#
#
# class UserProfile(models.Model):
#     """
#     User profile with nutrition goals and preferences.
#     Note: Renamed from User_Profile to follow Python naming conventions.
#     """
#     id = models.BigAutoField(primary_key=True)
#     user = models.OneToOneField(
#         User,  # Changed from string reference to direct class reference
#         on_delete=models.CASCADE,
#         # Changed from 'user_profile' to just 'profile' (cleaner)
#         related_name='profile'
#     )
#     daily_calorie_goal = models.SmallIntegerField(null=True)
#     daily_protein_goal = models.SmallIntegerField(null=True)
#     date_created = models.DateTimeField(auto_now_add=True)
#     # Changed to auto_now for automatic updates
#     date_updated = models.DateTimeField(auto_now=True)
#     bio = models.CharField(max_length=500, blank=True,
#                            default='')  # Added blank/default
#     diet_type = models.JSONField(default=dict, blank=True)  # Added default
#     # Fixed typo: profil -> profile
#     profile_picture = models.URLField(blank=True, default='')
#
#     def __str__(self):
#         return f"Profile for {self.user.username}" # type: ignore
#
#     class Meta:
#         db_table = 'user_profiles'
#         verbose_name = 'User Profile'
#         verbose_name_plural = 'User Profiles'
#
#
# class Recipe(models.Model):
#     """
#     Record of recipes
#     """
#
#     id = models.BigAutoField(primary_key=True)
#     # public_id = modles. Maybe?
#     name = models.CharField(max_length=30, unique=True)
#     date_created = models.DateTimeField(auto_now=True)
#     intstructions = models.TextField(max_length=300)
#     description = models.TextField(max_length=500)
#     cuisine_type = models.TextField(max_length=12)
#     dietary_tags = ArrayField(models.CharField(max_length=12))
#
#     class Meta:
#         db_table = "recipe"
#         verbose_name = "Recipe"
#         verbose_name_plural = "Recipes"
#
#
# class Ingredient(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     name = models.CharField(max_length=24, unique=True)
#     calories_per_100g = models.FloatField()
#     protein_per_100g = models.FloatField()
#     carbs_per_100g = models.FloatField()
#     fat_per_100g = models.FloatField()
#     fiber_per_100g = models.FloatField()
#     sugar_per_100g = models.FloatField()
#     sodium_per_100g = models.FloatField()
#     default_unit = models.CharField(max_length=20, default="g")
#
#     def save(self, *args, **kwargs):
#         if self.pk:
#             raise ValidationError(
#                 "This model is read only. Cannot be modified")
#         super().save(*args, **kwargs)
#
#     def delete(self, *args, **kwargs):
#         raise ValidationError(
#             "This model is read only. Cannot be modified")
#
#     class Meta:
#         db_table = "ingredient"
#         verbose_name = "Ingredient"
#         verbose_name_plural = "Ingredients"
#
#
# class RecipeIngredient(models.Model):
#     recipe = models.ForeignKey(
#         Recipe,
#         on_delete=models.CASCADE,
#         related_name="ingrdients"
#     )
#
#     ingredient = models.ForeignKey(
#         Ingredient,
#         on_delete=models.CASCADE,
#     )
#
#     quantity = models.FloatField()
#     unit = models.CharField(max_length=20)
#
#
# class RecipeInstruction(models.Model):
#     recipe = models.ForeignKey(
#         Recipe,
#         on_delete=models.CASCADE,
#         related_name="instructions"
#     )
#
#     step_number = models.PositiveSmallIntegerField()
#     text = models.TextField()
#
#     estimated_cooktime = models.PositiveSmallIntegerField(
#         null=True, blank=True)
#
#
# """
# To be refactored if not scratched all together
# """
#
#
# class TriedRecipe(models.Model):
#     """
#     Tracks recipes that users have tried.
#     """
#     id = models.BigAutoField(primary_key=True)
#     public_id = models.UUIDField(
#         default=uuid4,
#         editable=False,
#         unique=True,
#     )
#     recipe_id = models.PositiveBigIntegerField()
#     date_added = models.DateTimeField(auto_now_add=True)
#     tried_by = models.ForeignKey(
#         User,  # Changed from string reference to direct class reference
#         on_delete=models.CASCADE,
#         related_name='tried_recipes'
#     )
#
#     def __str__(self):
#         return f"{self.public_id} recipe tried by {self.tried_by.username}" # type: ignore
#
#     class Meta:
#         unique_together = ('tried_by', 'recipe_id')
#         db_table = 'tried_recipes'
#         verbose_name = 'Tried Recipe'
#         verbose_name_plural = 'Tried Recipes'
#         ordering = ['-date_added']  # Most recent first by default
