import { RecipeCard } from '../recipe/RecipeCard';
import type { Recipe } from '../../types/recipe';

interface FavoritesGridProps {
  favorites: Recipe[];
  onViewRecipe: (recipe: Recipe) => void;
  isFavorite: (recipeId: string) => boolean;
  onToggleFavorite: (recipeId: string) => void;
}

export function FavoritesGrid({
  favorites,
  onViewRecipe,
  isFavorite,
  onToggleFavorite,
}: FavoritesGridProps) {
  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {favorites.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onViewRecipe={onViewRecipe}
          isFavorite={isFavorite(recipe.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
