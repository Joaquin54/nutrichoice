import { MEAL_TYPE_CONFIG } from './mealPlanConstants';
import type { MealType } from './mealPlanConstants';

interface MealRowLabelProps {
  /** The meal type this label represents. */
  mealType: MealType;
}

/**
 * Renders the left-side row label for a meal type in the planning grid.
 *
 * Displays a colored indicator dot followed by the short uppercase meal name
 * (e.g., "BKFST", "LUNCH"). Uses the accent color defined in MEAL_TYPE_CONFIG.
 */
export function MealRowLabel({ mealType }: MealRowLabelProps) {
  const config = MEAL_TYPE_CONFIG[mealType];

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 bg-card">
      <span
        className={`h-2 w-2 rounded-full flex-shrink-0 ${config.dotClass}`}
        aria-hidden="true"
      />
      <span className="text-[9px] font-medium font-mono uppercase tracking-wider text-muted-foreground leading-none">
        {config.shortLabel}
      </span>
    </div>
  );
}
