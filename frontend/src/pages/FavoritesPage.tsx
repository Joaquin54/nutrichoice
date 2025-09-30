import { useNavigate } from 'react-router-dom';
import { FavoritesGrid, EmptyFavorites } from '../components/favorites';
import type { Recipe } from '../types/recipe';

export function FavoritesPage() {
  const navigate = useNavigate();
  
  // Mock data - in real app, this would come from API/context
  const favorites: Recipe[] = [];

  const handleViewRecipe = (recipe: Recipe) => {
    // TODO: Open recipe modal or navigate to recipe detail page
    console.log('Viewing recipe:', recipe.title);
  };

  const handleBrowseRecipes = () => {
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Favorites</h1>
        <p className="text-gray-600">
          Recipes you've saved and loved
        </p>
      </div>

      {favorites.length > 0 ? (
        <FavoritesGrid 
          favorites={favorites}
          onViewRecipe={handleViewRecipe}
        />
      ) : (
        <EmptyFavorites onBrowseRecipes={handleBrowseRecipes} />
      )}
    </div>
  );
}
