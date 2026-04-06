import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRecipes, RECIPES_QUERY_KEY } from './useRecipes';
import { getRecipes } from '../api';
import type { Recipe } from '../types/recipe';

const DEBOUNCE_MS = 300;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface UseRecipeSearchResult {
  recipes: Recipe[];
  isLoading: boolean;
  isSearching: boolean;
}

export function useRecipeSearch(query: string): UseRecipeSearchResult {
  const { recipes: allRecipes, isLoading: isInitialLoading } = useRecipes();
  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);

  // TanStack Query handles deduplication, caching, and race-condition prevention
  // automatically. The query is only enabled when a non-empty debounced query exists.
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: [...RECIPES_QUERY_KEY, { search: debouncedQuery }],
    queryFn: () => getRecipes({ search: debouncedQuery }),
    enabled: debouncedQuery.length > 0,
  });

  return {
    recipes: debouncedQuery ? searchResults : allRecipes,
    isLoading: isInitialLoading || isSearching,
    isSearching,
  };
}
