import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Search, Heart } from 'lucide-react';
import { useCookbooks } from '../../hooks/useCookbooks';
import { useRecipeActions } from '../../hooks/useRecipeActions';
import { useRecipes } from '../../hooks/useRecipes';
import type { Recipe } from '../../types/recipe';
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
  const { addRecipeToCookbook, getCookbook } = useCookbooks();
  const { favoriteRecipes } = useRecipeActions();
  const { recipes } = useRecipes();

  const cookbook = getCookbook(cookbookId);
  const existingIds = cookbook ? new Set(cookbook.recipeIds) : new Set<string>();

  const filteredAndSortedRecipes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? recipes.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query)
        )
      : [...recipes];
    // Favorites first, then the rest (recommended)
    return filtered.sort((a, b) => {
      const aFav = favoriteRecipes.has(a.id) ? 1 : 0;
      const bFav = favoriteRecipes.has(b.id) ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;
      return 0;
    });
  }, [recipes, searchQuery, favoriteRecipes]);

  const handleSelectRecipe = (recipe: Recipe) => {
    if (existingIds.has(recipe.id)) return;
    addRecipeToCookbook(cookbookId, recipe.id);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Add recipes to “{cookbookName}”
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Favorites appear first, then other recipes
          </p>
        </DialogHeader>

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
          <div className="grid grid-cols-2 gap-4">
            {filteredAndSortedRecipes.map((recipe) => {
              const isInCookbook = existingIds.has(recipe.id);
              const isFavorite = favoriteRecipes.has(recipe.id);
              return (
                <button
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe)}
                  disabled={isInCookbook}
                  className="text-left border rounded-lg p-3 hover:border-[#6ec257] dark:hover:border-[#6ec257]/70 hover:bg-[#6ec257]/10 dark:hover:bg-[#6ec257]/20 transition-all group bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 disabled:opacity-60 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:border-gray-200"
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
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[#6ec257] dark:group-hover:text-[#6ec257]/90 text-gray-900 dark:text-white">
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
              <p>No recipes found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
