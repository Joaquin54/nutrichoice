import { useState, useMemo, useCallback } from 'react';
import { useMealPlanning } from '../hooks/useMealPlanning';
import { WeekNavigator } from '../components/mealPlanning/WeekNavigator';
import { MacroStrip } from '../components/mealPlanning/MacroStrip';
import { MealGrid } from '../components/mealPlanning/MealGrid';
import { RecipeSelector } from '../components/mealPlanning/RecipeSelector';
import type { MealType } from '../components/mealPlanning/mealPlanConstants';

/** Returns the Sunday that starts the week containing the given date. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Meal Planning page — orchestrates the weekly meal planning experience.
 *
 * Owns top-level state (current week, selected recipe slot) and composes
 * all feature components: WeekNavigator, MacroStrip, MealGrid, RecipeSelector.
 * All data-fetching and state mutation is delegated to hooks and child components.
 */
export function MealPlanningPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  );
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);

  const { getMealPlansForWeek, getDailyMacros, removeMealPlan } = useMealPlanning();

  const weekDays = useMemo<Date[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const weekPlans = useMemo(
    () => getMealPlansForWeek(currentWeekStart),
    [getMealPlansForWeek, currentWeekStart]
  );

  const todayMacros = useMemo(() => {
    const todayString = new Date().toISOString().split('T')[0];
    return getDailyMacros(todayString);
  }, [getDailyMacros]);

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

  const handleRemoveMeal = useCallback((date: string, mealType: MealType) => {
    removeMealPlan(date, mealType);
  }, [removeMealPlan]);

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

      <MacroStrip macros={todayMacros} />

      <MealGrid
        weekDays={weekDays}
        weekPlans={weekPlans}
        onAddMeal={handleAddMeal}
        onRemoveMeal={handleRemoveMeal}
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
