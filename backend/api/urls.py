from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views.feed import RecipeFeedView
from api.views.health import HealthView
from api.views.storage import SaveUrlView, SignedUrlView
from api.views.ingredients import IngredientsViewSet
from api.views.nutrition import RecipeNutritionView
from api.views.recipes import (
    CookbookViewSet,
    RecipeCreateView,
    RecipeLikeViewSet,
    RecipeViewSet,
    TriedRecipeViewSet,
)
from api.views.profiles import UserProfileViewSet
from api.views.social import UserBlockViewSet, UserFollowViewSet
from api.views.users import (
    UserRegistrationView, UserLoginView, UserLogoutView,
    UserPasswordChangeRequestView, UserPasswordChangeView,
    UserPasswordChangeConfirmView, UserTokenRefreshView,
    CurrentUserView, UserViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tried-recipes', TriedRecipeViewSet)
router.register(r'user-profiles', UserProfileViewSet, basename='userprofile')
router.register(r'cookbooks', CookbookViewSet, basename='cookbook')
router.register(r'recipe-likes', RecipeLikeViewSet, basename='recipelike')
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'ingredients', IngredientsViewSet, basename='ingredient')
router.register(r'follows', UserFollowViewSet, basename='follow')
router.register(r'blocks', UserBlockViewSet, basename='block')

urlpatterns = [
    # Explicit paths are listed before the router include so that
    # /api/recipes/create/ is never captured by the recipes detail pattern.
    path('storage/signed-url/', SignedUrlView.as_view(), name='storage-signed-url'),
    path('storage/save-url/', SaveUrlView.as_view(), name='storage-save-url'),
    path('health/', HealthView.as_view(), name='health-check'),
    path('recipe-feed/', RecipeFeedView.as_view(), name='recipe-feed'),
    path('recipes/create/', RecipeCreateView.as_view(), name='recipe-create'),
    path('recipes/<int:recipe_id>/nutrition/', RecipeNutritionView.as_view(), name='recipe-nutrition'),

    # Authentication endpoints
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    path('auth/login/', UserLoginView.as_view(), name='user-login'),
    path('auth/logout/', UserLogoutView.as_view(), name='user-logout'),
    path('auth/password-reset-request/', UserPasswordChangeRequestView.as_view(), name='password-reset-request'),
    path('auth/password-change/', UserPasswordChangeView.as_view(), name='password-change'),
    path('auth/password-reset-confirm/', UserPasswordChangeConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/token-refresh/', UserTokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),

    # Router-generated endpoints (always last)
    path('', include(router.urls)),
]
