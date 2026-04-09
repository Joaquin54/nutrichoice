from django.db import models
from users.models import User

# Create your models here.
class UserProfile(models.Model):
    """
    User profile with nutrition goals and preferences.
    Note: Renamed from User_Profile to follow Python naming conventions.

    diet_type semantic states:
      - None  : user skipped onboarding — no dietary preference has been expressed
      - {}    : preferences were explicitly cleared by the user
      - dict  : populated dict of active dietary preference booleans
    """
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        User,  # Changed from string reference to direct class reference
        on_delete=models.CASCADE,
        # Changed from 'user_profile' to just 'profile' (cleaner)
        related_name='profile'
    )
    daily_calorie_goal = models.SmallIntegerField(null=True)
    daily_protein_goal = models.SmallIntegerField(null=True)
    daily_carbs_goal = models.SmallIntegerField(null=True, blank=True)
    daily_fat_goal = models.SmallIntegerField(null=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    # Changed to auto_now for automatic updates
    date_updated = models.DateTimeField(auto_now=True)
    bio = models.CharField(max_length=500, blank=True,
                           default='')  # Added blank/default
    # diet_type semantic states: None = skipped onboarding (no preference expressed); {} = preferences explicitly cleared; populated dict = active dietary preferences
    diet_type = models.JSONField(null=True, blank=True, default=None)
    # Fixed typo: profil -> profile
    profile_picture = models.URLField(max_length=500, blank=True, default='')
    is_onboarded = models.BooleanField(default=False, db_index=True)
    allergies = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Profile for {self.user.username}" # type: ignore

    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
