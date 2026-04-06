import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoritesGrid, EmptyFavorites } from '../components/favorites';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RecipeModal } from '../components/recipe/RecipeModal';
import { CreateRecipeModal } from '../components/recipe/CreateRecipeModal';
import { useRecipeActions } from '../hooks/useRecipeActions';
import { useRecipes } from '../hooks/useRecipes';
import { getRecipes } from '../api';
import { Heart, CheckCircle, ChefHat, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { RecipeCard } from '../components/recipe/RecipeCard';
import type { Recipe } from '../types/recipe';

export function FavoritesPage() {
  const navigate = useNavigate();
  const { favoriteRecipes, triedRecipes, isFavorite, toggleFavorite } = useRecipeActions();
  const { recipes } = useRecipes();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);

  const refetchMyRecipes = useCallback(() => {
    getRecipes({ creator: 'me' })
      .then(setMyRecipes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refetchMyRecipes();
  }, [refetchMyRecipes]);

  const favorites = useMemo(
    () => recipes.filter(recipe => favoriteRecipes.has(recipe.id)),
    [recipes, favoriteRecipes]
  );

  const tried = useMemo(
    () => recipes.filter(recipe => triedRecipes.has(recipe.id)),
    [recipes, triedRecipes]
  );

  const handleViewRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  }, []);

  const handleBrowseRecipes = () => {
    navigate('/home');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Recipes
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Your favorites, tried recipes, and creations
        </p>
      </div>

      <Tabs defaultValue="my-recipes" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="favorites" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Favorites</span>
            <span className="sm:hidden">Fav</span>
            <span>({favorites.length})</span>
          </TabsTrigger>
          <TabsTrigger value="tried" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tried</span>
            <span className="sm:hidden">Tried</span>
            <span>({tried.length})</span>
          </TabsTrigger>
          <TabsTrigger value="my-recipes" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <ChefHat className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">My Recipes</span>
            <span className="sm:hidden">Mine</span>
            <span>({myRecipes.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="mt-4 sm:mt-6">
          {favorites.length > 0 ? (
            <FavoritesGrid
              favorites={favorites}
              onViewRecipe={handleViewRecipe}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <EmptyFavorites
              onBrowseRecipes={handleBrowseRecipes}
              message="No favorites yet"
              description="Start adding recipes to your favorites by clicking the heart icon on any recipe card!"
            />
          )}
        </TabsContent>

        {/* Tried Tab */}
        <TabsContent value="tried" className="mt-4 sm:mt-6">
          {tried.length > 0 ? (
            <FavoritesGrid
              favorites={tried}
              onViewRecipe={handleViewRecipe}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <EmptyFavorites
              onBrowseRecipes={handleBrowseRecipes}
              message="No tried recipes yet"
              description="Mark recipes as tried by clicking the check icon on any recipe card!"
            />
          )}
        </TabsContent>

        {/* My Recipes Tab */}
        <TabsContent value="my-recipes" className="mt-4 sm:mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {myRecipes.length === 0
                  ? 'No recipes created yet'
                  : `${myRecipes.length} recipe${myRecipes.length === 1 ? '' : 's'} created`}
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#6ec257] hover:bg-[#5aad44] text-white gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                New Recipe
              </Button>
            </div>

            {myRecipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {myRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onViewRecipe={handleViewRecipe}
                    isFavorite={isFavorite(recipe.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#6ec257]/10 flex items-center justify-center mb-4">
                  <ChefHat className="h-8 w-8 text-[#6ec257]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Share your culinary creations
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  Create and save your own recipes with ingredients, instructions, and dietary tags.
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#6ec257] hover:bg-[#5aad44] text-white gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Recipe
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <CreateRecipeModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); refetchMyRecipes(); }}
      />
    </div>
  );
}