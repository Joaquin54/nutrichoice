import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Recipe } from '../types/recipe';

const MY_RECIPES_KEY = 'nutrichoice_my_recipes';

interface RecipeActionsContextType {
  favoriteRecipes: Set<string>;
  triedRecipes: Set<string>;
  myRecipes: Recipe[];
  toggleFavorite: (recipeId: string) => void;
  toggleTried: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  isTried: (recipeId: string) => boolean;
  addMyRecipe: (recipe: Recipe) => void;
  removeMyRecipe: (recipeId: string) => void;
}

const RecipeActionsContext = createContext<RecipeActionsContextType | undefined>(undefined);

export function RecipeActionsProvider({ children }: { children: ReactNode }) {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Set<string>>(new Set());
  const [triedRecipes, setTriedRecipes] = useState<Set<string>>(new Set());
  const [myRecipes, setMyRecipes] = useState<Recipe[]>(() => {
    try {
      const stored = localStorage.getItem(MY_RECIPES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((recipeId: string) => {
    setFavoriteRecipes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  }, []);

  const toggleTried = useCallback((recipeId: string) => {
    setTriedRecipes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  }, []);

  const isFavorite = useCallback((recipeId: string) => {
    return favoriteRecipes.has(recipeId);
  }, [favoriteRecipes]);

  const isTried = useCallback((recipeId: string) => {
    return triedRecipes.has(recipeId);
  }, [triedRecipes]);

  const addMyRecipe = useCallback((recipe: Recipe) => {
    setMyRecipes(prev => {
      const updated = [recipe, ...prev];
      localStorage.setItem(MY_RECIPES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeMyRecipe = useCallback((recipeId: string) => {
    setMyRecipes(prev => {
      const updated = prev.filter(r => r.id !== recipeId);
      localStorage.setItem(MY_RECIPES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <RecipeActionsContext.Provider
      value={{
        favoriteRecipes,
        triedRecipes,
        myRecipes,
        toggleFavorite,
        toggleTried,
        isFavorite,
        isTried,
        addMyRecipe,
        removeMyRecipe,
      }}
    >
      {children}
    </RecipeActionsContext.Provider>
  );
}

export function useRecipeActions() {
  const context = useContext(RecipeActionsContext);
  if (context === undefined) {
    throw new Error('useRecipeActions must be used within a RecipeActionsProvider');
  }
  return context;
}
