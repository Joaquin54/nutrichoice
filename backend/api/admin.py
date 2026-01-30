from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from users.models import User
from users.models import User
from profiles.models import UserProfile
from recipes.models import (
    Recipe,
    RecipeIngredient,
    RecipeInstruction
)
from ingredients.models import Ingredient
from social.models import TriedRecipe
# from nutrition.models import


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_created')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_created')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_created',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'daily_calorie_goal', 'daily_protein_goal', 'date_created')
    search_fields = ('user__username', 'user__email')


@admin.register(TriedRecipe)
class TriedRecipeAdmin(admin.ModelAdmin):
    list_display = ('public_id', 'recipe_id', 'tried_by', 'date_added')
    list_filter = ('date_added',)
    search_fields = ('tried_by__username', 'recipe_id')
