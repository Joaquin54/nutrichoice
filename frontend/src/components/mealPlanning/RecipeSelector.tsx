import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { useRecipes } from '../../hooks/useRecipes';
import { useMealPlanning } from '../../hooks/useMealPlanning';
import type { MealType } from './mealPlanConstants';
import { MEAL_TYPE_CONFIG } from './mealPlanConstants';
import type { Recipe } from '../../types/recipe';

interface RecipeSelectorProps {
  /** ISO date string (e.g., "2026-04-06") for the slot being filled. */
  date: string;
  /** Which meal slot is being filled. */
  mealType: MealType;
  /** Called when the dialog should close (recipe selected or dismissed). */
  onClose: () => void;
}

/**
 * Modal dialog for selecting a recipe to add to a meal planning slot.
 *
 * Fetches real recipes from the API via `useRecipes()`. Provides a live
 * search filter (name or description, case-insensitive). On selection,
 * writes the meal plan via context and closes.
 */
export function RecipeSelector({ date, mealType, onClose }: RecipeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { recipes, isLoading } = useRecipes();
  const { addMealPlan } = useMealPlanning();

  const config = MEAL_TYPE_CONFIG[mealType];

  const filteredRecipes = recipes.filter((recipe) => {
    const q = searchQuery.toLowerCase();
    return (
      recipe.name.toLowerCase().includes(q) ||
      recipe.description.toLowerCase().includes(q)
    );
  });

  function handleSelectRecipe(recipe: Recipe) {
    addMealPlan(date, mealType, recipe);
    onClose();
  }

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Select Recipe for{' '}
            <span style={{ color: config.accentColor }}>{config.label}</span>
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">{formattedDate}</p>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#6ec257]" />
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>
                {searchQuery
                  ? 'No recipes match your search.'
                  : 'No recipes found. Create some recipes first!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe)}
                  className="text-left border rounded-lg p-3 hover:border-[#6ec257] dark:hover:border-[#6ec257]/70 hover:bg-[#6ec257]/10 dark:hover:bg-[#6ec257]/20 transition-all group bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <div className="flex gap-3">
                    <ImageWithFallback
                      src={recipe.image_1}
                      alt={recipe.name}
                      className="w-20 h-20 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[#6ec257] dark:group-hover:text-[#6ec257]/90 text-gray-900 dark:text-white">
                        {recipe.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {recipe.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
