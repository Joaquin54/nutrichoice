import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Recipe } from '../types/recipe';
import { getRecipes, getAuthToken } from '../api';

interface RecipesContextType {
  recipes: Recipe[];
  isLoading: boolean;
  getRecipeById: (id: string) => Recipe | undefined;
  addRecipe: (recipe: Recipe) => void;
}

const RecipesContext = createContext<RecipesContextType | undefined>(undefined);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) return;
    setIsLoading(true);
    getRecipes()
      .then(setRecipes)
      .catch(() => {
        // Non-fatal — recipes stay empty; pages degrade gracefully
      })
      .finally(() => setIsLoading(false));
  }, []);

  const getRecipeById = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes]
  );

  // Prepends a newly-created recipe to the global list without a full refetch.
  const addRecipe = useCallback((recipe: Recipe) => {
    setRecipes((prev) => [recipe, ...prev]);
  }, []);

  return (
    <RecipesContext.Provider value={{ recipes, isLoading, getRecipeById, addRecipe }}>
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipesProvider');
  }
  return context;
}
