from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views.health import HealthView
from api.views.recipes import (
    TriedRecipeViewSet
)
from api.views.profiles import (
    UserProfileViewSet
)
from api.views.users import (
    UserRegistrationView, UserLoginView, UserLogoutView,
    UserPasswordChangeRequestView, UserPasswordChangeView,
    UserPasswordChangeConfirmView, UserTokenRefreshView,
    CurrentUserView, UserViewSet
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tried-recipes', TriedRecipeViewSet)
router.register(r'user-profiles', UserProfileViewSet, basename='userprofile')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('health/', HealthView.as_view(), name='health-check'),

    # Authentication endpoints
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    path('auth/login/', UserLoginView.as_view(), name='user-login'),
    path('auth/logout/', UserLogoutView.as_view(), name='user-logout'),
    path('auth/password-reset-request/', UserPasswordChangeRequestView.as_view(), name='password-reset-request'),
    path('auth/password-change/', UserPasswordChangeView.as_view(), name='password-change'),
    path('auth/password-reset-confirm/', UserPasswordChangeConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/token-refresh/', UserTokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
]

