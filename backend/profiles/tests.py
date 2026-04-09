from django.test import TestCase
from django.contrib.auth import get_user_model

from profiles.models import UserProfile

User = get_user_model()


class UserProfileDietTypeNullableTests(TestCase):
  """
  Tests for the nullable diet_type field on UserProfile.

  Verifies the three semantic states:
    - None  : user skipped onboarding — no preference expressed
    - {}    : preferences explicitly cleared
    - dict  : active dietary preferences
  """

  def setUp(self) -> None:
    self.user = User.objects.create_user(
      username='diettest_user', password='testpass123'
    )

  def test_diet_type_defaults_to_none_on_creation(self) -> None:
    """diet_type should be NULL in the database when created without a value."""
    profile = UserProfile.objects.create(user=self.user)
    self.assertIsNone(profile.diet_type)

  def test_diet_type_accepts_explicit_none(self) -> None:
    """Saving diet_type=None should persist as SQL NULL."""
    profile = UserProfile.objects.create(user=self.user, diet_type=None)
    profile.refresh_from_db()
    self.assertIsNone(profile.diet_type)

  def test_diet_type_accepts_empty_dict(self) -> None:
    """Saving diet_type={} should persist as an empty JSON object (not NULL)."""
    profile = UserProfile.objects.create(user=self.user, diet_type={})
    profile.refresh_from_db()
    self.assertEqual(profile.diet_type, {})

  def test_diet_type_accepts_populated_dict(self) -> None:
    """Saving a populated dict should round-trip correctly."""
    prefs = {'vegetarian': True, 'vegan': False}
    profile = UserProfile.objects.create(user=self.user, diet_type=prefs)
    profile.refresh_from_db()
    self.assertEqual(profile.diet_type, prefs)
