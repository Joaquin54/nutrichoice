import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMealPlanning, aggregateMacrosForDate, aggregateMacrosForWeek } from '../hooks/useMealPlanning';
import type { DailyMacros } from '../hooks/useMealPlanning';
import { WeekNavigator } from '../components/mealPlanning/WeekNavigator';
import { MacroStrip } from '../components/mealPlanning/MacroStrip';
import { MealGrid } from '../components/mealPlanning/MealGrid';
import { RecipeSelector } from '../components/mealPlanning/RecipeSelector';
import { fetchDailyMacros } from '../api';
import type { MealType } from '../components/mealPlanning/mealPlanConstants';
import { toLocalISODate } from '../lib/utils';

/** Returns the Sunday that starts the week containing the given date. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

const DEFAULT_TARGETS: DailyMacros = { calories: 2000, protein: 120, carbs: 250, fat: 65 };

/**
 * Meal Planning page — orchestrates the weekly meal planning experience.
 *
 * Owns top-level state (current week, selected recipe slot, selected forecast date, macro
 * targets) and composes all feature components: WeekNavigator, MacroStrip, MealGrid,
 * RecipeSelector.
 *
 * `selectedDate` is the single source of truth for which day's macros are displayed in
 * the MacroStrip. It is lifted here so both `MacroStrip` and `MealGrid` stay in sync
 * without any duplicated state.
 */
export function MealPlanningPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(new Date()),
  );
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);
  const [todayTargets, setTodayTargets] = useState<DailyMacros>(DEFAULT_TARGETS);

  // The day whose macros are shown in MacroStrip. Defaults to today. Single source of
  // truth — passed down to MealGrid and MacroStrip; never duplicated.
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toLocalISODate(new Date()),
  );

  // When true, MacroStrip shows the 7-day weekly aggregate instead of a single day.
  const [isWeekView, setIsWeekView] = useState(false);

  const { mealPlans, isLoading, loadWeek, getMealPlansForWeek, removeMealPlan } =
    useMealPlanning();

  // Fetch the week's plan whenever currentWeekStart changes.
  useEffect(() => {
    loadWeek(currentWeekStart);
  }, [currentWeekStart, loadWeek]);

  // Compute the 7 days for the current week (used for clamping and rendering).
  const weekDays = useMemo<Date[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  // Clamp selectedDate when the displayed week changes: keep today if it falls in the
  // new week, otherwise reset to the week's first day (Sunday).
  useEffect(() => {
    const weekIsoSet = new Set(weekDays.map(toLocalISODate));
    if (!weekIsoSet.has(selectedDate)) {
      const todayIso = toLocalISODate(new Date());
      setSelectedDate(weekIsoSet.has(todayIso) ? todayIso : toLocalISODate(weekDays[0]));
    }
  // weekDays identity changes whenever currentWeekStart changes — that's the trigger.
  // selectedDate intentionally excluded: we only clamp when the week changes, not when
  // the user selects a different day within the same week.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays]);

  // Fetch user macro targets once on mount. Targets rarely change so a single fetch is
  // sufficient; only data.targets (not data.totals) is consumed from this response.
  useEffect(() => {
    const todayStr = toLocalISODate(new Date());
    fetchDailyMacros(todayStr)
      .then((data) => {
        setTodayTargets(data.targets);
      })
      .catch((err) => {
        console.error('[MealPlanning] Failed to fetch macro targets:', err);
      });
  }, []);

  // ISO strings for the 7 days of the current week — stable reference tied to weekDays.
  const weekDayIsos = useMemo<string[]>(
    () => weekDays.map(toLocalISODate),
    [weekDays],
  );

  // Aggregate macros: weekly sum when isWeekView is active, otherwise single-day.
  // Pure client-side O(n) computation — no network request on toggle or day selection.
  const displayedMacros = useMemo<DailyMacros>(
    () =>
      isWeekView
        ? aggregateMacrosForWeek(mealPlans, weekDayIsos)
        : aggregateMacrosForDate(mealPlans, selectedDate),
    [isWeekView, mealPlans, weekDayIsos, selectedDate],
  );

  // Weekly targets: multiply each daily target ×7 so progress bars stay proportional.
  const displayedTargets = useMemo(
    () =>
      isWeekView
        ? {
            calories: todayTargets.calories * 7,
            protein: todayTargets.protein * 7,
            carbs: todayTargets.carbs * 7,
            fat: todayTargets.fat * 7,
          }
        : todayTargets,
    [isWeekView, todayTargets],
  );

  // Resolve the selected Date object for MacroStrip's displayDate prop.
  const selectedDateObj = useMemo<Date>(() => {
    const found = weekDays.find((d) => toLocalISODate(d) === selectedDate);
    // Fallback: parse from the ISO string directly (always valid).
    return found ?? new Date(`${selectedDate}T00:00:00`);
  }, [weekDays, selectedDate]);

  const weekPlans = useMemo(
    () => getMealPlansForWeek(currentWeekStart),
    [getMealPlansForWeek, currentWeekStart],
  );

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeekStart(getWeekStart(new Date()));
  }, []);

  const handleAddMeal = useCallback((date: string, mealType: MealType) => {
    setSelectedSlot({ date, mealType });
  }, []);

  const handleRemoveMeal = useCallback(
    (date: string, mealType: MealType) => {
      removeMealPlan(date, mealType).catch(console.error);
    },
    [removeMealPlan],
  );

  const handleCloseSelector = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  const handleSelectDate = useCallback((iso: string) => {
    setSelectedDate(iso);
    setIsWeekView(false);
  }, []);

  const handleToggleWeekView = useCallback(() => {
    setIsWeekView((v) => !v);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Meal Planning
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Plan your meals for the week ahead
        </p>
      </div>

      <WeekNavigator
        currentWeekStart={currentWeekStart}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onGoToToday={goToToday}
      />

      <MacroStrip
        macros={displayedMacros}
        targets={displayedTargets}
        displayDate={isWeekView ? undefined : selectedDateObj}
        isWeekView={isWeekView}
        weekStart={weekDays[0]}
        weekEnd={weekDays[6]}
      />

      <MealGrid
        weekDays={weekDays}
        weekPlans={weekPlans}
        onAddMeal={handleAddMeal}
        onRemoveMeal={handleRemoveMeal}
        isLoading={isLoading}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        isWeekView={isWeekView}
        onToggleWeekView={handleToggleWeekView}
      />

      {selectedSlot && (
        <RecipeSelector
          date={selectedSlot.date}
          mealType={selectedSlot.mealType}
          onClose={handleCloseSelector}
        />
      )}
    </div>
  );
}
