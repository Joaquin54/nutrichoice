import { useState } from 'react';
import { cn } from '../../lib/utils';
import { MEAL_TYPES, MEAL_TYPE_CONFIG } from './mealPlanConstants';
import type { MealType } from './mealPlanConstants';
import { DayHeader } from './DayHeader';
import { MealRowLabel } from './MealRowLabel';
import { MealCell } from './MealCell';
import type { MealPlan } from '../../hooks/useMealPlanning';

interface MealGridProps {
  /** Array of 7 Date objects representing the displayed week (Sunday first). */
  weekDays: Date[];
  /** Map of ISO date string → array of meal plans for that day. */
  weekPlans: Map<string, MealPlan[]>;
  /** Called when the user clicks an empty meal slot to open the recipe selector. */
  onAddMeal: (dateString: string, mealType: MealType) => void;
  /** Called when the user removes a planned meal from a slot. */
  onRemoveMeal: (dateString: string, mealType: MealType) => void;
  /** When true, dims the grid to indicate a background fetch is in progress. */
  isLoading?: boolean;
}

const todayString = new Date().toDateString();

/** Returns true if the given date is today. */
function checkIsToday(date: Date): boolean {
  return date.toDateString() === todayString;
}

/**
 * The core weekly meal planning grid.
 *
 * Renders differently by breakpoint:
 * - **Desktop (md+)**: Full 8-column CSS Grid (60px label col + 7 equal day cols).
 *   The `bg-border` container shows through the `gap-px` to create hairline grid lines.
 *   Horizontally scrollable at tablet widths.
 * - **Mobile (<md)**: Single-day card view. A horizontal scrollable pill selector
 *   at the top lets the user switch between days; the selected day's 5 meal slots
 *   are shown as a vertical stack below.
 */
export function MealGrid({ weekDays, weekPlans, onAddMeal, onRemoveMeal, isLoading = false }: MealGridProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const todayIdx = weekDays.findIndex(checkIsToday);
    return todayIdx >= 0 ? todayIdx : 0;
  });

  return (
    <div className={cn('transition-opacity duration-200', isLoading && 'opacity-50 pointer-events-none')}>
      {/* ── Desktop / Tablet grid ───────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
        {/* bg-border shows through gap-px to create hairline grid lines */}
        <div
          className="grid gap-px bg-border"
          style={{ gridTemplateColumns: '60px repeat(7, minmax(0, 1fr))' }}
        >
          {/* Corner cell */}
          <div className="bg-card" />

          {/* Day header row */}
          {weekDays.map((date) => {
            const ds = date.toISOString().split('T')[0];
            return <DayHeader key={ds} date={date} isToday={checkIsToday(date)} />;
          })}

          {/* Meal rows — flattened so each cell is a direct grid child */}
          {MEAL_TYPES.flatMap((mealType) => {
            const labelCell = (
              <MealRowLabel key={`label-${mealType}`} mealType={mealType} />
            );
            const dayCells = weekDays.map((date) => {
              const ds = date.toISOString().split('T')[0];
              const dayPlans = weekPlans.get(ds) ?? [];
              const mealPlan = dayPlans.find((p) => p.mealType === mealType);
              return (
                <div
                  key={`${mealType}-${ds}`}
                  className={cn(
                    'bg-card p-1',
                    checkIsToday(date) && 'bg-[#6ec257]/5 dark:bg-[#6ec257]/10'
                  )}
                >
                  <MealCell
                    mealPlan={mealPlan}
                    mealType={mealType}
                    dateString={ds}
                    onAddMeal={onAddMeal}
                    onRemoveMeal={onRemoveMeal}
                  />
                </div>
              );
            });
            return [labelCell, ...dayCells];
          })}
        </div>
      </div>

      {/* ── Mobile single-day view ──────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {/* Day pill selector */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
          role="tablist"
          aria-label="Select day"
        >
          {weekDays.map((date, idx) => {
            const selected = idx === selectedDayIndex;
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();
            return (
              <button
                key={date.toISOString()}
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedDayIndex(idx)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg text-center transition-colors',
                  selected
                    ? 'bg-[#6ec257]/15 dark:bg-[#6ec257]/20 border border-[#6ec257]/40'
                    : 'border border-border hover:bg-muted'
                )}
              >
                <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                  {dayName}
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold font-mono leading-tight',
                    checkIsToday(date) ? 'text-[#6ec257]' : 'text-foreground'
                  )}
                >
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected day meal slots */}
        {renderMobileDaySlots()}
      </div>
    </div>
  );

  /** Renders the vertical meal slot list for the currently selected day on mobile. */
  function renderMobileDaySlots() {
    const selectedDate = weekDays[selectedDayIndex];
    const ds = selectedDate.toISOString().split('T')[0];
    const dayPlans = weekPlans.get(ds) ?? [];

    return (
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {MEAL_TYPES.map((mealType) => {
          const mealPlan = dayPlans.find((p) => p.mealType === mealType);
          const config = MEAL_TYPE_CONFIG[mealType];
          return (
            <div key={mealType} className="flex items-center gap-3 px-3 py-2 bg-card">
              <div className="flex items-center gap-2 w-16 flex-shrink-0">
                <span
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${config.dotClass}`}
                  aria-hidden="true"
                />
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  {config.shortLabel}
                </span>
              </div>
              <div className="flex-1">
                <MealCell
                  mealPlan={mealPlan}
                  mealType={mealType}
                  dateString={ds}
                  onAddMeal={onAddMeal}
                  onRemoveMeal={onRemoveMeal}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}
