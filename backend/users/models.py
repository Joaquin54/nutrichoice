from django.db import models
from uuid import uuid4
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser, UserManager

# Create your models here.

class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.

    Inherited fields from AbstractUser:
    - username (already defined, max_length=150)
    - first_name (already defined, max_length=150)
    - last_name (already defined, max_length=150)
    - email (already defined, max_length=254)
    - password (already defined, handles hashing automatically)
    - is_staff, is_active, is_superuser (for admin/permissions)
    - last_login, date_joined (timestamps)

    We override some field properties and add custom fields below.
    """
    # Use UserManager to get create_user method
    objects = UserManager()
    # Override inherited fields to match your original constraints
    username = models.CharField(max_length=24, unique=True)
    first_name = models.CharField(max_length=35)
    last_name = models.CharField(max_length=35)
    # Added unique constraint
    email = models.EmailField(max_length=70, unique=True)

    # Your custom fields
    public_id = models.UUIDField(
        default=uuid4,
        editable=False,
        unique=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)

    # Optional: Specify which field to use for login
    # USERNAME_FIELD = 'email'  # Uncomment to allow login with email instead of username
    # REQUIRED_FIELDS = ['username']  # Fields required when creating superuser

    def __str__(self):
        return str(self.public_id)

    class Meta: # type: ignore[assignment]
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

