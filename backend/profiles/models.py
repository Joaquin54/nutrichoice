from django.db import models
from users.models import User

# Create your models here.
class UserProfile(models.Model):
    """
    User profile with nutrition goals and preferences.
    Note: Renamed from User_Profile to follow Python naming conventions.
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
    date_created = models.DateTimeField(auto_now_add=True)
    # Changed to auto_now for automatic updates
    date_updated = models.DateTimeField(auto_now=True)
    bio = models.CharField(max_length=500, blank=True,
                           default='')  # Added blank/default
    diet_type = models.JSONField(default=dict, blank=True)  # Added default
    # Fixed typo: profil -> profile
    profile_picture = models.URLField(blank=True, default='')

    def __str__(self):
        return f"Profile for {self.user.username}" # type: ignore

    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
