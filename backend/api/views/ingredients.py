from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter

from ingredients.models import Ingredient
from api.serializers.ingredients import IngredientSerializer


class IngredientsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = IngredientSerializer

    # Base queryset (no need to override get_queryset for this simple case)
    queryset = Ingredient.objects.all().order_by("name")

    # Enables: /api/ingredients/?search=chick
    # Enables: /api/ingredients/?ordering=name  or  ?ordering=-name
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name"]
    ordering = ["name"]
