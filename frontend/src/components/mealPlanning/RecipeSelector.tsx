import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import { mockRecipes } from '../../data/mockRecipes';
import { useMealPlanning, type MealPlan } from '../../hooks/useMealPlanning';
import type { Recipe } from '../../types/recipe';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface RecipeSelectorProps {
  date: string;
  mealType: MealPlan['mealType'];
  onClose: () => void;
}

export function RecipeSelector({ date, mealType, onClose }: RecipeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { addMealPlan } = useMealPlanning();

  const filteredRecipes = mockRecipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRecipe = (recipe: Recipe) => {
    addMealPlan(date, mealType, recipe);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Select Recipe for {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(date)}</p>
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
            {filteredRecipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleSelectRecipe(recipe)}
                className="text-left border rounded-lg p-3 hover:border-[#6ec257] dark:hover:border-[#6ec257]/70 hover:bg-[#6ec257]/10 dark:hover:bg-[#6ec257]/20 transition-all group bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <div className="flex gap-3">
                  <ImageWithFallback
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-20 h-20 object-cover rounded"
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

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No recipes found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

