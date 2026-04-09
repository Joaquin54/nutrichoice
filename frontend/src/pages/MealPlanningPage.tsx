import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMealPlanning } from '../hooks/useMealPlanning';
import type { DailyMacros } from '../hooks/useMealPlanning';
import { WeekNavigator } from '../components/mealPlanning/WeekNavigator';
import { MacroStrip } from '../components/mealPlanning/MacroStrip';
import { MealGrid } from '../components/mealPlanning/MealGrid';
import { RecipeSelector } from '../components/mealPlanning/RecipeSelector';
import { fetchDailyMacros } from '../api';
import type { MealType } from '../components/mealPlanning/mealPlanConstants';

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
 * Owns top-level state (current week, selected recipe slot, today's macros) and
 * composes all feature components: WeekNavigator, MacroStrip, MealGrid, RecipeSelector.
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

  const { mealPlans, isLoading, loadWeek, getMealPlansForWeek, removeMealPlan } =
    useMealPlanning();

  // Fetch the week's plan whenever currentWeekStart changes.
  useEffect(() => {
    loadWeek(currentWeekStart);
  }, [currentWeekStart, loadWeek]);

  // Fetch user macro targets once on mount. Targets rarely change so a single
  // fetch is sufficient; we only use data.targets (not data.totals) from this response.
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    fetchDailyMacros(todayStr)
      .then((data) => {
        setTodayTargets(data.targets);
      })
      .catch((err) => {
        console.error('[MealPlanning] Failed to fetch macro targets:', err);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute today's macro totals client-side from the loaded meal plans.
  // Uses the same UTC-based date string format that is stored in mealPlans[].date.
  // This is synchronous and always reflects the current mealPlans state without
  // an extra network round-trip.
  const todayMacros = useMemo<DailyMacros>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return mealPlans
      .filter((p) => p.date === todayStr)
      .reduce(
        (acc, p) => ({
          calories: acc.calories + (p.calories != null ? parseFloat(p.calories) : 0),
          protein: acc.protein + (p.protein != null ? parseFloat(p.protein) : 0),
          carbs: acc.carbs + (p.carbs != null ? parseFloat(p.carbs) : 0),
          fat: acc.fat + (p.fat != null ? parseFloat(p.fat) : 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 } as DailyMacros,
      );
  }, [mealPlans]);

  const weekDays = useMemo<Date[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

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

      <MacroStrip macros={todayMacros} targets={todayTargets} />

      <MealGrid
        weekDays={weekDays}
        weekPlans={weekPlans}
        onAddMeal={handleAddMeal}
        onRemoveMeal={handleRemoveMeal}
        isLoading={isLoading}
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
