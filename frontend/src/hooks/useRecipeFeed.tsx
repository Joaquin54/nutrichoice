import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getRecipeFeed, apiRecipeToRecipe } from '../api';
import type { Recipe } from '../types/recipe';

export interface RecipeFeedHook {
  recipes: Recipe[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Fetches the personalised recipe feed using cursor-based pagination.
 * useInfiniteQuery handles deduplication, caching, and background refetching.
 * The external interface is kept identical to the previous manual implementation
 * so RecipeFeedPage requires no changes.
 */
export function useRecipeFeed(): RecipeFeedHook {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['recipe-feed'],
    queryFn: ({ pageParam }) => getRecipeFeed(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.next !== null ? (lastPageParam as number) + 1 : undefined,
  });

  // Flatten all pages into a single deduplicated recipe list.
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
  };
}
