"""
Management command to fetch and display a recipe with all its ingredient data
from the live Supabase database.

Usage:
    python manage.py inspect_recipe                     # show all recipes
    python manage.py inspect_recipe "Beef Stirfry"      # by name
    python manage.py inspect_recipe --id 42             # by ID
    python manage.py inspect_recipe --random            # random recipe

Run inside Docker:
    docker-compose exec backend python manage.py inspect_recipe
"""

from typing import Any

from django.core.management.base import BaseCommand, CommandParser

from nutrition.models import RecipeNutrition
from recipes.models import Recipe, RecipeIngredient


class Command(BaseCommand):
  help = "Fetch and display recipe data with full ingredient details."

  def add_arguments(self, parser: CommandParser) -> None:
    parser.add_argument(
      "name",
      nargs="?",
      type=str,
      default=None,
      help="Recipe name (or partial match). Omit to show all.",
    )
    parser.add_argument(
      "--id",
      type=int,
      default=None,
      help="Fetch a single recipe by its primary key.",
    )
    parser.add_argument(
      "--random",
      action="store_true",
      help="Fetch one random recipe.",
    )

  def handle(self, *args: Any, **options: Any) -> None:
    recipes = self._resolve_recipes(options)

    if not recipes.exists():
      self.stderr.write(self.style.ERROR("No recipes found."))
      return

    for recipe in recipes.prefetch_related("ingredients__ingredient"):
      self._print_recipe(recipe)

    self.stdout.write(
      self.style.SUCCESS(f"\nTotal recipes displayed: {recipes.count()}")
    )

  def _resolve_recipes(self, options: dict[str, Any]):
    """Return a queryset based on the provided filters."""
    if options["id"] is not None:
      return Recipe.objects.filter(pk=options["id"])

    if options["random"]:
      return Recipe.objects.order_by("?")[:1]

    if options["name"]:
      qs = Recipe.objects.filter(name__icontains=options["name"])
      if not qs.exists():
        self.stderr.write(
          self.style.WARNING(
            f"No exact match for '{options['name']}', "
            f"trying partial match..."
          )
        )
      return qs

    return Recipe.objects.all().order_by("name")

  def _print_recipe(self, recipe: Recipe) -> None:
    """Print a single recipe with all ingredient and nutrition data."""
    sep = "=" * 60
    self.stdout.write(f"\n{sep}")
    self.stdout.write(self.style.HTTP_INFO(f"  Recipe ID:      {recipe.pk}"))
    self.stdout.write(self.style.HTTP_INFO(f"  Name:           {recipe.name}"))
    self.stdout.write(f"  Cuisine:        {recipe.cuisine_type}")
    self.stdout.write(f"  Dietary Tags:   {', '.join(recipe.dietary_tags)}")
    self.stdout.write(f"  Creator:        {recipe.creator}")
    self.stdout.write(sep)

    ingredients = recipe.ingredients.select_related("ingredient").all()

    if not ingredients.exists():
      self.stdout.write(self.style.WARNING("  (no ingredients)"))
    else:
      self.stdout.write(f"  {'Ingredient':<22} {'Qty':>8} {'Unit':<5}  "
                        f"{'Cal':>7} {'Pro':>7} {'Carb':>7} "
                        f"{'Fat':>7} {'Fib':>7} {'Sug':>7} {'Sod':>7}")
      self.stdout.write(f"  {'-' * 22} {'-' * 8} {'-' * 5}  "
                        f"{'-' * 7} {'-' * 7} {'-' * 7} "
                        f"{'-' * 7} {'-' * 7} {'-' * 7} {'-' * 7}")

      for ri in ingredients:
        ing = ri.ingredient
        self.stdout.write(
          f"  {ing.name:<22} {ri.quantity:>8.1f} {ri.unit:<5}  "
          f"{ing.calories_per_100g:>7} {ing.protein_per_100g:>7} "
          f"{ing.carbs_per_100g:>7} {ing.fat_per_100g:>7} "
          f"{ing.fiber_per_100g:>7} {ing.sugar_per_100g:>7} "
          f"{ing.sodium_per_100g:>7}"
        )

    # Nutrition totals
    try:
      n = RecipeNutrition.objects.get(recipe=recipe)
      self.stdout.write(f"\n  Nutrition (total):")
      self.stdout.write(
        f"    Calories: {n.calories}  Protein: {n.protein}g  "
        f"Carbs: {n.carbs}g  Fat: {n.fat}g  "
        f"Fiber: {n.fiber}g  Sugar: {n.sugar}g  Sodium: {n.sodium}mg"
      )
    except RecipeNutrition.DoesNotExist:
      self.stdout.write(self.style.WARNING("  Nutrition: not computed"))
