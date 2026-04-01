import { useState, useEffect } from 'react';
import { useRecipes } from './useRecipes';
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
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    // cancelled flag prevents a slow in-flight response from overwriting
    // the result of a newer query (stale-closure / race condition guard).
    let cancelled = false;
    setIsSearching(true);

    getRecipes({ search: debouncedQuery })
      .then((results) => { if (!cancelled) setSearchResults(results); })
      .catch(() => { if (!cancelled) setSearchResults([]); })
      .finally(() => { if (!cancelled) setIsSearching(false); });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  return {
    recipes: debouncedQuery ? searchResults : allRecipes,
    isLoading: isInitialLoading || isSearching,
    isSearching,
  };
}
