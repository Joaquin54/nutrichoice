import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoritesGrid, EmptyFavorites } from '../components/favorites';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RecipeModal } from '../components/recipe/RecipeModal';
import { useRecipeActions } from '../hooks/useRecipeActions';
import { mockRecipes } from '../data/mockRecipes';
import { Heart, CheckCircle } from 'lucide-react';
import type { Recipe } from '../types/recipe';

export function FavoritesPage() {
  const navigate = useNavigate();
  const { favoriteRecipes, triedRecipes } = useRecipeActions();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get the actual recipe objects from IDs
  const favorites = useMemo(() => 
    mockRecipes.filter(recipe => favoriteRecipes.has(recipe.id)),
    [favoriteRecipes]
  );

  const tried = useMemo(() => 
    mockRecipes.filter(recipe => triedRecipes.has(recipe.id)),
    [triedRecipes]
  );

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  const handleBrowseRecipes = () => {
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Recipe Collection</h1>
        <p className="text-gray-600">
          Recipes you've saved and tried
        </p>
      </div>

      <Tabs defaultValue="favorites" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites ({favorites.length})
          </TabsTrigger>
          <TabsTrigger value="tried" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Tried ({tried.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-6">
          {favorites.length > 0 ? (
            <FavoritesGrid 
              favorites={favorites}
              onViewRecipe={handleViewRecipe}
            />
          ) : (
            <EmptyFavorites 
              onBrowseRecipes={handleBrowseRecipes}
              message="No favorites yet"
              description="Start adding recipes to your favorites by clicking the heart icon on any recipe card!"
            />
          )}
        </TabsContent>

        <TabsContent value="tried" className="mt-6">
          {tried.length > 0 ? (
            <FavoritesGrid 
              favorites={tried}
              onViewRecipe={handleViewRecipe}
            />
          ) : (
            <EmptyFavorites 
              onBrowseRecipes={handleBrowseRecipes}
              message="No tried recipes yet"
              description="Mark recipes as tried by clicking the check icon on any recipe card!"
            />
          )}
        </TabsContent>
      </Tabs>

      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
