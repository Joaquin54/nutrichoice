import { memo } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MEAL_TYPE_CONFIG } from './mealPlanConstants';
import type { MealType } from './mealPlanConstants';
import type { MealPlan } from '../../hooks/useMealPlanning';

interface MealCellProps {
  /** The planned meal for this slot, or undefined if the slot is empty. */
  mealPlan: MealPlan | undefined;
  /** Which meal type this cell represents. */
  mealType: MealType;
  /** ISO date string (e.g., "2026-04-06") identifying the day column. */
  dateString: string;
  /** Called when the user clicks the empty-slot add button. */
  onAddMeal: (dateString: string, mealType: MealType) => void;
  /** Called when the user removes an existing meal from this slot. */
  onRemoveMeal: (dateString: string, mealType: MealType) => void;
}

/**
 * A single cell in the meal planning grid.
 *
 * Renders in one of two states:
 * - **Filled**: A color-coded chip showing the recipe name (2-line clamp) with
 *   a remove button that appears on hover (always visible on touch devices).
 * - **Empty**: A subtle full-cell button showing a `+` icon that brightens on hover.
 *
 * Wrapped in React.memo to avoid unnecessary re-renders across the 35-cell grid.
 */
export const MealCell = memo(function MealCell({
  mealPlan,
  mealType,
  dateString,
  onAddMeal,
  onRemoveMeal,
}: MealCellProps) {
  const config = MEAL_TYPE_CONFIG[mealType];

  if (mealPlan) {
    return (
      <div
        className={cn(
          'relative group h-full min-h-[56px] rounded p-1.5 text-left',
          config.chipClasses
        )}
      >
        <p className="text-[10px] font-medium leading-tight line-clamp-2 pr-4">
          {mealPlan.recipe.name}
        </p>
        {mealPlan.calories != null && (
          <span className="text-[9px] font-mono opacity-60 mt-0.5 block">
            {Math.round(parseFloat(mealPlan.calories))} kcal
          </span>
        )}
        <button
          onClick={() => onRemoveMeal(dateString, mealType)}
          className="absolute top-1 right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove ${mealPlan.recipe.name} from ${config.label}`}
        >
          <X className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onAddMeal(dateString, mealType)}
      className={cn(
        'h-full min-h-[56px] w-full flex items-center justify-center',
        'text-gray-200 dark:text-gray-700',
        'hover:text-gray-400 dark:hover:text-gray-500',
        'hover:bg-gray-50 dark:hover:bg-gray-800/40',
        'transition-colors duration-150 rounded'
      )}
      aria-label={`Add ${config.label} on ${dateString}`}
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
    </button>
  );
});
