import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Recipe } from '../types/recipe';
import {
  getRecipeLikes,
  likeRecipe,
  unlikeRecipe,
  getTriedRecipes,
  markRecipeTried,
  unmarkRecipeTried,
  getAuthToken,
} from '../api';

const MY_RECIPES_KEY = 'nutrichoice_my_recipes';

function normalizeStoredRecipe(raw: unknown): Recipe | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === 'string' ? r.id : null;
  const name =
    typeof r.name === 'string'
      ? r.name
      : typeof r.title === 'string'
        ? r.title
        : null;

  if (!id || !name) return null;

  return {
    id,
    name,
    description: typeof r.description === 'string' ? r.description : '',
    image: typeof r.image === 'string' ? r.image : undefined,
    dietary_tags: Array.isArray(r.dietary_tags)
      ? r.dietary_tags.filter((t): t is string => typeof t === 'string')
      : Array.isArray(r.dietaryTags)
        ? r.dietaryTags.filter((t): t is string => typeof t === 'string')
        : [],
    ingredients: Array.isArray(r.ingredients)
      ? r.ingredients.filter((i): i is string => typeof i === 'string')
      : [],
    instructions: Array.isArray(r.instructions)
      ? r.instructions.filter((i): i is string => typeof i === 'string')
      : [],
    cuisine_type: typeof r.cuisine_type === 'string'
      ? r.cuisine_type
      : typeof r.cuisine === 'string'
        ? r.cuisine
        : undefined,
    creator: typeof r.creator === 'string' ? r.creator : undefined,
    rating: typeof r.rating === 'number' ? r.rating : undefined,
  };
}

interface RecipeActionsContextType {
  favoriteRecipes: Set<string>;
  triedRecipes: Set<string>;
  myRecipes: Recipe[];
  toggleFavorite: (recipeId: string) => Promise<void>;
  toggleTried: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  isTried: (recipeId: string) => boolean;
  addMyRecipe: (recipe: Recipe) => void;
  removeMyRecipe: (recipeId: string) => void;
}

const RecipeActionsContext = createContext<RecipeActionsContextType | undefined>(undefined);

export function RecipeActionsProvider({ children }: { children: ReactNode }) {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Set<string>>(new Set());
  const [triedRecipes, setTriedRecipes] = useState<Set<string>>(new Set());

  // likeId lookup: recipe string ID → backend like ID (for deletion)
  const likeEdgeIds = useRef<Map<string, number>>(new Map());
  // triedId lookup: recipe string ID → backend tried public_id (for deletion)
  const triedEdgeIds = useRef<Map<string, string>>(new Map());

  const [myRecipes, setMyRecipes] = useState<Recipe[]>(() => {
    try {
      const stored = localStorage.getItem(MY_RECIPES_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      const normalized = parsed
        .map(normalizeStoredRecipe)
        .filter((r): r is Recipe => r !== null);

      // Persist normalized shape so older localStorage payloads are upgraded once.
      localStorage.setItem(MY_RECIPES_KEY, JSON.stringify(normalized));
      return normalized;
    } catch {
      return [];
    }
  });

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

    if (isNaN(numericId)) return; // mock/non-backend recipe — keep optimistic only

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

    if (isNaN(numericId)) return; // mock/non-backend recipe — keep optimistic only

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

  // myRecipes stays on localStorage — recipe creation requires deeper backend
  // integration that is out of scope for this migration phase.
  const addMyRecipe = useCallback((recipe: Recipe) => {
    setMyRecipes((prev) => {
      const updated = [recipe, ...prev];
      localStorage.setItem(MY_RECIPES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeMyRecipe = useCallback((recipeId: string) => {
    setMyRecipes((prev) => {
      const updated = prev.filter((r) => r.id !== recipeId);
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
