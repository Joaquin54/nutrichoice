import { useState, useCallback, useRef, useEffect } from 'react';
import { getRecipeFeed, apiRecipeToRecipe } from '../api';
import type { Recipe } from '../types/recipe';

export interface RecipeFeedHook {
  recipes: Recipe[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function useRecipeFeed(): RecipeFeedHook {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Track the next page to fetch and whether a request is in flight.
  const nextPageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const loadInitial = useCallback(async () => {
    // Block any in-flight loadMore from appending after this reset.
    isFetchingRef.current = true;
    setIsLoading(true);
    nextPageRef.current = 1;
    try {
      const data = await getRecipeFeed(1);
      setRecipes(data.results.map(apiRecipeToRecipe));
      setHasMore(data.next !== null);
      nextPageRef.current = 2;
    } catch {
      setRecipes([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    // Guard: do not fire if already fetching or no more pages exist.
    if (isFetchingRef.current || !hasMore) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const data = await getRecipeFeed(nextPageRef.current);
      setRecipes((prev) => {
        const seenIds = new Set(prev.map(r => r.id));
        return [...prev, ...data.results.map(apiRecipeToRecipe).filter(r => !seenIds.has(r.id))];
      });
      setHasMore(data.next !== null);
      nextPageRef.current += 1;
    } catch {
      // Non-fatal: user can scroll past the sentinel again to retry.
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [hasMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return { recipes, isLoading, isLoadingMore, hasMore, loadMore };
}
