import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Recipe } from '../types/recipe';
import type { MealType } from '../components/mealPlanning/mealPlanConstants';

/** A single planned meal entry associating a date, meal slot, and recipe. */
export interface MealPlan {
  /** ISO date string (e.g., "2026-04-06"). */
  date: string;
  /** Which meal slot this entry occupies. */
  mealType: MealType;
  /** The recipe assigned to this slot. */
  recipe: Recipe;
}

/**
 * Daily aggregated macro totals computed from all planned meals on a given date.
 * Values are zero when no meals are planned or when recipe nutrition data is unavailable.
 */
export interface DailyMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlanningContextType {
  mealPlans: MealPlan[];
  addMealPlan: (date: string, mealType: MealType, recipe: Recipe) => void;
  removeMealPlan: (date: string, mealType: MealType) => void;
  getMealPlansForDate: (date: string) => MealPlan[];
  getMealPlansForWeek: (startDate: Date) => Map<string, MealPlan[]>;
  /** Returns aggregated macro totals for a given date. Returns zeros until recipe nutrition fields are available. */
  getDailyMacros: (date: string) => DailyMacros;
}

const MealPlanningContext = createContext<MealPlanningContextType | undefined>(undefined);

/** Provides meal planning state to all descendant components. */
export function MealPlanningProvider({ children }: { children: ReactNode }) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);

  /**
   * Adds or replaces the meal plan for a specific date and meal type.
   * If a plan already exists for that slot, it is overwritten.
   */
  const addMealPlan = useCallback((date: string, mealType: MealType, recipe: Recipe) => {
    setMealPlans((prev) => {
      const filtered = prev.filter(
        (plan) => !(plan.date === date && plan.mealType === mealType)
      );
      return [...filtered, { date, mealType, recipe }];
    });
  }, []);

  /** Removes the meal plan for a specific date and meal type slot, if one exists. */
  const removeMealPlan = useCallback((date: string, mealType: MealType) => {
    setMealPlans((prev) =>
      prev.filter((plan) => !(plan.date === date && plan.mealType === mealType))
    );
  }, []);

  /** Returns all meal plans for a specific date. */
  const getMealPlansForDate = useCallback((date: string): MealPlan[] => {
    return mealPlans.filter((plan) => plan.date === date);
  }, [mealPlans]);

  /**
   * Returns a Map of date strings to meal plans for the 7-day week starting at `startDate`.
   * Each key is an ISO date string; values are arrays of meal plans for that day.
   */
  const getMealPlansForWeek = useCallback((startDate: Date): Map<string, MealPlan[]> => {
    const weekPlans = new Map<string, MealPlan[]>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      weekPlans.set(dateString, getMealPlansForDate(dateString));
    }

    return weekPlans;
  }, [getMealPlansForDate]);

  /**
   * Returns aggregated macro totals (calories, protein, carbs, fat) for all meals
   * planned on a given date.
   *
   * Currently returns zero values because the Recipe type does not yet carry nutrition
   * fields. This function is ready for future integration: once nutrition data is added
   * to Recipe, update this function to sum the values.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDailyMacros = useCallback((_date: string): DailyMacros => {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }, []);

  return (
    <MealPlanningContext.Provider
      value={{
        mealPlans,
        addMealPlan,
        removeMealPlan,
        getMealPlansForDate,
        getMealPlansForWeek,
        getDailyMacros,
      }}
    >
      {children}
    </MealPlanningContext.Provider>
  );
}

/**
 * Consumes the MealPlanningContext.
 * Must be used within a MealPlanningProvider.
 */
export function useMealPlanning(): MealPlanningContextType {
  const context = useContext(MealPlanningContext);
  if (context === undefined) {
    throw new Error('useMealPlanning must be used within a MealPlanningProvider');
  }
  return context;
}
