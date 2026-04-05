import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Search, Heart } from 'lucide-react';
import { useCookbooks } from '../../hooks/useCookbooks';
import { useRecipeActions } from '../../hooks/useRecipeActions';
import { getRecipes } from '../../api';
import type { Recipe } from '../../types/recipe';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface CookbookRecipeSelectorProps {
  cookbookId: string;
  cookbookName: string;
  onClose: () => void;
}

export function CookbookRecipeSelector({
  cookbookId,
  cookbookName,
  onClose,
}: CookbookRecipeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addingRecipeId, setAddingRecipeId] = useState<string | null>(null);
  const [scopedRecipes, setScopedRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const { addRecipeToCookbook, getCookbook, fetchCookbookDetail } = useCookbooks();

  useEffect(() => {
    void fetchCookbookDetail(cookbookId);
  }, [cookbookId, fetchCookbookDetail]);

  useEffect(() => {
    setIsLoadingRecipes(true);
    getRecipes({ scope: 'cookbook' })
      .then(setScopedRecipes)
      .catch(() => setScopedRecipes([]))
      .finally(() => setIsLoadingRecipes(false));
  }, []);

  const { favoriteRecipes } = useRecipeActions();

  const cookbook = getCookbook(cookbookId);
  const existingIds = cookbook ? new Set(cookbook.recipeIds) : new Set<string>();

  const filteredAndSortedRecipes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? scopedRecipes.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query)
        )
      : [...scopedRecipes];
    // Favorites first, then the rest (recommended)
    return filtered.sort((a, b) => {
      const aFav = favoriteRecipes.has(a.id) ? 1 : 0;
      const bFav = favoriteRecipes.has(b.id) ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;
      return 0;
    });
  }, [scopedRecipes, searchQuery, favoriteRecipes]);

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (existingIds.has(recipe.id) || addingRecipeId) return;
    setAddError(null);
    setAddingRecipeId(recipe.id);
    try {
      await addRecipeToCookbook(cookbookId, recipe.id);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Could not add recipe. Try again.');
    } finally {
      setAddingRecipeId(null);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="z-[100] max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{ pointerEvents: 'auto' }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            Add recipes to “{cookbookName}”
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing recipes you've created or liked.
          </p>
        </DialogHeader>

        {addError && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {addError}
          </p>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingRecipes ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Loading your recipes...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {filteredAndSortedRecipes.map((recipe) => {
                  const isInCookbook = existingIds.has(recipe.id);
                  const isFavorite = favoriteRecipes.has(recipe.id);
                  const isAdding = addingRecipeId === recipe.id;
                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      disabled={isAdding}
                      onClick={() => {
                        if (isInCookbook) return;
                        void handleSelectRecipe(recipe);
                      }}
                      className={cn(
                        'group text-left rounded-lg border p-3 transition-all bg-white dark:bg-gray-800',
                        isInCookbook
                          ? 'cursor-default border-[#6ec257] bg-[#6ec257]/10 dark:border-[#6ec257]/70 dark:bg-[#6ec257]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#6ec257] hover:bg-[#6ec257]/10 dark:hover:border-[#6ec257]/70 dark:hover:bg-[#6ec257]/20',
                        isAdding && 'cursor-wait opacity-60'
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <ImageWithFallback
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          {isFavorite && (
                            <span className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5">
                              <Heart className="h-3 w-3 text-white fill-white" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={cn(
                              'line-clamp-2 text-sm font-medium',
                              isInCookbook
                                ? 'text-[#6ec257] dark:text-[#6ec257]/90'
                                : 'text-gray-900 group-hover:text-[#6ec257] dark:text-white dark:group-hover:text-[#6ec257]/90'
                            )}
                          >
                            {recipe.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                            {recipe.description}
                          </p>
                          {isInCookbook && (
                            <span className="inline-block mt-1 text-xs text-[#6ec257] font-medium">
                              Added ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredAndSortedRecipes.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>
                    {searchQuery.trim()
                      ? 'No recipes found'
                      : "You haven't created or liked any recipes yet."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
