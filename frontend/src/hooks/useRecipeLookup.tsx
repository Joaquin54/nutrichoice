import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getRecipeLookup, apiRecipeToRecipe } from '../api';
import type { DietaryFilter, Recipe } from '../types/recipe';

export interface RecipeLookupHook {
  recipes: Recipe[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const DEBOUNCE_MS = 300;

/**
 * Debounces a value: returns the latest value only after the value has been
 * stable for `delay` ms. Prevents query key churn on every keystroke.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Fetches paginated recipes from /api/recipe-lookup/ with diet + allergy filtering,
 * stable seeded random ordering, and debounced search.
 *
 * - seed is stable for the lifetime of the component mount (useRef). A different
 *   mount (i.e. page reload) gets a fresh seed so order changes on reload (F4).
 * - dietOverride=null uses the user's profile prefs (server-side).
 * - dietOverride=DietaryFilter sends explicit ?diets= params (session-only, never persisted).
 * - loadMore is guarded against concurrent fetches (F10).
 */
export function useRecipeLookup({
  search,
  dietOverride,
}: {
  search: string;
  dietOverride: DietaryFilter | null;
}): RecipeLookupHook {
  // Stable seed for this mount — different on each page reload (addresses F4).
  const seedRef = useRef<string>(crypto.randomUUID());
  const seed = seedRef.current;

  const debouncedSearch = useDebounce(search.trim(), DEBOUNCE_MS);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['recipe-lookup', { search: debouncedSearch, seed, dietOverride }],
    queryFn: ({ pageParam }) =>
      getRecipeLookup({
        page: pageParam as number,
        search: debouncedSearch,
        seed,
        dietOverride,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.next !== null ? (lastPageParam as number) + 1 : undefined,
  });

  // Flatten all pages into a deduplicated recipe list (F3: guard against
  // server-side duplicates near page boundaries).
  const recipes: Recipe[] = [];
  const seenIds = new Set<string>();
  for (const page of data?.pages ?? []) {
    for (const apiRecipe of page.results) {
      const recipe = apiRecipeToRecipe(apiRecipe);
      if (!seenIds.has(recipe.id)) {
        seenIds.add(recipe.id);
        recipes.push(recipe);
      }
    }
  }

  // totalCount from the first page's `count` field (DRF pagination).
  const totalCount = data?.pages[0]?.count ?? 0;

  // loadMore is guarded: only fires when there is a next page and no fetch
  // is already in flight (addresses F10).
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    recipes,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    loadMore,
    totalCount,
  };
}
