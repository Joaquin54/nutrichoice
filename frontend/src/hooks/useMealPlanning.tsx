import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Recipe } from '../types/recipe';

export interface MealPlan {
  date: string; // ISO date string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: Recipe;
}

interface MealPlanningContextType {
  mealPlans: MealPlan[];
  addMealPlan: (date: string, mealType: MealPlan['mealType'], recipe: Recipe) => void;
  removeMealPlan: (date: string, mealType: MealPlan['mealType']) => void;
  getMealPlansForDate: (date: string) => MealPlan[];
  getMealPlansForWeek: (startDate: Date) => Map<string, MealPlan[]>;
}

const MealPlanningContext = createContext<MealPlanningContextType | undefined>(undefined);

export function MealPlanningProvider({ children }: { children: ReactNode }) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);

  const addMealPlan = useCallback((date: string, mealType: MealPlan['mealType'], recipe: Recipe) => {
    setMealPlans((prev) => {
      // Remove any existing meal plan for this date and meal type
      const filtered = prev.filter(
        (plan) => !(plan.date === date && plan.mealType === mealType)
      );
      return [...filtered, { date, mealType, recipe }];
    });
  }, []);

  const removeMealPlan = useCallback((date: string, mealType: MealPlan['mealType']) => {
    setMealPlans((prev) =>
      prev.filter((plan) => !(plan.date === date && plan.mealType === mealType))
    );
  }, []);

  const getMealPlansForDate = useCallback((date: string) => {
    return mealPlans.filter((plan) => plan.date === date);
  }, [mealPlans]);

  const getMealPlansForWeek = useCallback((startDate: Date) => {
    const weekPlans = new Map<string, MealPlan[]>();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      weekPlans.set(dateString, getMealPlansForDate(dateString));
    }
    
    return weekPlans;
  }, [mealPlans, getMealPlansForDate]);

  return (
    <MealPlanningContext.Provider
      value={{
        mealPlans,
        addMealPlan,
        removeMealPlan,
        getMealPlansForDate,
        getMealPlansForWeek,
      }}
    >
      {children}
    </MealPlanningContext.Provider>
  );
}

export function useMealPlanning() {
  const context = useContext(MealPlanningContext);
  if (context === undefined) {
    throw new Error('useMealPlanning must be used within a MealPlanningProvider');
  }
  return context;
}

