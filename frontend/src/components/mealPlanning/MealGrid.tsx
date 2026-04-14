import { Columns3 } from 'lucide-react';
import { cn, toLocalISODate } from '../../lib/utils';
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
  /**
   * ISO date string of the currently selected day whose macros are displayed in
   * the MacroStrip. Drives both the desktop header underline and the mobile pill highlight.
   * Single source of truth — owned by `MealPlanningPage`.
   */
  selectedDate: string;
  /** Called when the user selects a different day (desktop header click or mobile pill tap). */
  onSelectDate: (iso: string) => void;
  /** Whether the macro strip is in "show all days" week-view mode. */
  isWeekView: boolean;
  /** Called when the user clicks the select-all-days toggle button. */
  onToggleWeekView: () => void;
}

/** Returns true if the given date is today (evaluated at call time, not module load). */
function checkIsToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

/**
 * The core weekly meal planning grid.
 *
 * Renders differently by breakpoint:
 * - **Desktop (md+)**: Full 8-column CSS Grid (60px label col + 7 equal day cols).
 *   The `bg-border` container shows through the `gap-px` to create hairline grid lines.
 *   Horizontally scrollable at tablet widths. Clicking a day-column header updates
 *   `selectedDate` (lifted to `MealPlanningPage`) to drive the `MacroStrip` forecast.
 * - **Mobile (<md)**: Single-day card view. A horizontal scrollable pill selector
 *   at the top lets the user switch between days; the selected day's 5 meal slots
 *   are shown as a vertical stack below.
 *
 * Selection state is owned by the parent — `selectedDate` / `onSelectDate` are required
 * props (no internal copy).
 */
export function MealGrid({
  weekDays,
  weekPlans,
  onAddMeal,
  onRemoveMeal,
  isLoading = false,
  selectedDate,
  onSelectDate,
  isWeekView,
  onToggleWeekView,
}: MealGridProps) {
  // Derive the mobile pill index from the lifted selectedDate. Falls back to 0 if the
  // selectedDate is somehow not in the current week (clamped by MealPlanningPage).
  const selectedDayIndex = Math.max(
    0,
    weekDays.findIndex((d) => toLocalISODate(d) === selectedDate),
  );

  return (
    <div className={cn('transition-opacity duration-200', isLoading && 'opacity-50 pointer-events-none')}>
      {/* ── Desktop / Tablet grid ───────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
        {/* bg-border shows through gap-px to create hairline grid lines */}
        <div
          className="grid gap-px bg-border"
          style={{ gridTemplateColumns: '60px repeat(7, minmax(0, 1fr))' }}
        >
          {/* Corner cell — select-all-days toggle */}
          <button
            type="button"
            onClick={onToggleWeekView}
            aria-pressed={isWeekView}
            aria-label="Show weekly totals"
            className={cn(
              'bg-card flex items-center justify-center transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ec257]/60',
              isWeekView
                ? 'bg-[#6ec257]/15 dark:bg-[#6ec257]/20 text-[#6ec257]'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Columns3 className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Day header row — each header is a button that selects the forecast day */}
          {weekDays.map((date) => {
            const ds = toLocalISODate(date);
            return (
              <DayHeader
                key={ds}
                date={date}
                isToday={checkIsToday(date)}
                isSelected={isWeekView || ds === selectedDate}
                onSelect={() => onSelectDate(ds)}
              />
            );
          })}

          {/* Meal rows — flattened so each cell is a direct grid child */}
          {MEAL_TYPES.flatMap((mealType) => {
            const labelCell = (
              <MealRowLabel key={`label-${mealType}`} mealType={mealType} />
            );
            const dayCells = weekDays.map((date) => {
              const ds = toLocalISODate(date);
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
          {/* Select-all-days toggle — first pill in the horizontal scroll strip */}
          <button
            type="button"
            onClick={onToggleWeekView}
            aria-pressed={isWeekView}
            aria-label="Show weekly totals"
            className={cn(
              'flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ec257]/60',
              isWeekView
                ? 'bg-[#6ec257]/15 dark:bg-[#6ec257]/20 border-[#6ec257]/40 text-[#6ec257]'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <Columns3 className="h-4 w-4" aria-hidden="true" />
          </button>

          {weekDays.map((date, idx) => {
            const selected = isWeekView || idx === selectedDayIndex;
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();
            return (
              <button
                key={date.toISOString()}
                role="tab"
                aria-selected={selected}
                onClick={() => onSelectDate(toLocalISODate(date))}
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
    const activeDayDate = weekDays[selectedDayIndex];
    const ds = toLocalISODate(activeDayDate);
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
