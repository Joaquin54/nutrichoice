// hooks/useRecipeActions.tsx
// Manages favorites and tried-recipes state — backed by the backend API.
// myRecipes localStorage logic has been removed; recipe creation now goes through
// the backend via CreateRecipeModal + useRecipes.addRecipe().

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  getRecipeLikes,
  likeRecipe,
  unlikeRecipe,
  getTriedRecipes,
  markRecipeTried,
  unmarkRecipeTried,
  getAuthToken,
} from '../api';

interface RecipeActionsContextType {
  favoriteRecipes: Set<string>;
  triedRecipes: Set<string>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  toggleTried: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  isTried: (recipeId: string) => boolean;
}

const RecipeActionsContext = createContext<RecipeActionsContextType | undefined>(undefined);

export function RecipeActionsProvider({ children }: { children: ReactNode }) {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Set<string>>(new Set());
  const [triedRecipes, setTriedRecipes] = useState<Set<string>>(new Set());

  // likeId lookup: recipe string ID → backend like ID (for deletion)
  const likeEdgeIds = useRef<Map<string, number>>(new Map());
  // triedId lookup: recipe string ID → backend tried public_id (for deletion)
  const triedEdgeIds = useRef<Map<string, string>>(new Map());

  // Hydrate likes and tried from backend on mount
  useEffect(() => {
    if (!getAuthToken()) return;

    getRecipeLikes()
      .then((likes) => {
        const ids = new Set<string>();
        likes.forEach((l) => {
          const id = String(l.recipe);
          ids.add(id);
          likeEdgeIds.current.set(id, l.id);
        });
        setFavoriteRecipes(ids);
      })
      .catch(() => {
        // Non-fatal — keep empty set
      });

    getTriedRecipes()
      .then((tried) => {
        const ids = new Set<string>();
        tried.forEach((t) => {
          if (t.recipe != null) {
            const id = String(t.recipe);
            ids.add(id);
            triedEdgeIds.current.set(id, t.public_id);
          }
        });
        setTriedRecipes(ids);
      })
      .catch(() => {
        // Non-fatal — keep empty set
      });
  }, []);

  const toggleFavorite = useCallback(async (recipeId: string) => {
    const numericId = parseInt(recipeId, 10);
    const isLiked = likeEdgeIds.current.has(recipeId);

    // Optimistic update
    setFavoriteRecipes((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(recipeId) : next.add(recipeId);
      return next;
    });

    if (isNaN(numericId)) return; // non-backend recipe — keep optimistic only

    try {
      if (isLiked) {
        const edgeId = likeEdgeIds.current.get(recipeId)!;
        await unlikeRecipe(edgeId);
        likeEdgeIds.current.delete(recipeId);
      } else {
        const like = await likeRecipe(numericId);
        likeEdgeIds.current.set(recipeId, like.id);
      }
    } catch {
      // Revert optimistic update on failure
      setFavoriteRecipes((prev) => {
        const next = new Set(prev);
        isLiked ? next.add(recipeId) : next.delete(recipeId);
        return next;
      });
    }
  }, []);

  const toggleTried = useCallback(async (recipeId: string) => {
    const numericId = parseInt(recipeId, 10);
    const isTried = triedEdgeIds.current.has(recipeId);

    // Optimistic update
    setTriedRecipes((prev) => {
      const next = new Set(prev);
      isTried ? next.delete(recipeId) : next.add(recipeId);
      return next;
    });

    if (isNaN(numericId)) return; // non-backend recipe — keep optimistic only

    try {
      if (isTried) {
        const publicId = triedEdgeIds.current.get(recipeId)!;
        await unmarkRecipeTried(publicId);
        triedEdgeIds.current.delete(recipeId);
      } else {
        const tried = await markRecipeTried(numericId);
        triedEdgeIds.current.set(recipeId, tried.public_id);
      }
    } catch {
      // Revert optimistic update on failure
      setTriedRecipes((prev) => {
        const next = new Set(prev);
        isTried ? next.add(recipeId) : next.delete(recipeId);
        return next;
      });
    }
  }, []);

  const isFavorite = useCallback(
    (recipeId: string) => favoriteRecipes.has(recipeId),
    [favoriteRecipes]
  );

  const isTried = useCallback(
    (recipeId: string) => triedRecipes.has(recipeId),
    [triedRecipes]
  );

  return (
    <RecipeActionsContext.Provider
      value={{ favoriteRecipes, triedRecipes, toggleFavorite, toggleTried, isFavorite, isTried }}
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
