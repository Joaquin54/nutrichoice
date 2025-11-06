from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, TriedRecipeViewSet, HealthView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tried-recipes', TriedRecipeViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('health/', HealthView.as_view(), name='health-check'),
]

