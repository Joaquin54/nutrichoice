import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface RecipeActionsContextType {
  favoriteRecipes: Set<string>;
  triedRecipes: Set<string>;
  toggleFavorite: (recipeId: string) => void;
  toggleTried: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  isTried: (recipeId: string) => boolean;
}

const RecipeActionsContext = createContext<RecipeActionsContextType | undefined>(undefined);

export function RecipeActionsProvider({ children }: { children: ReactNode }) {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Set<string>>(new Set());
  const [triedRecipes, setTriedRecipes] = useState<Set<string>>(new Set());

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

  return (
    <RecipeActionsContext.Provider
      value={{
        favoriteRecipes,
        triedRecipes,
        toggleFavorite,
        toggleTried,
        isFavorite,
        isTried,
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

