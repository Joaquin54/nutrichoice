import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Recipe } from '../types/recipe';
import type { MealType } from '../components/mealPlanning/mealPlanConstants';
import {
  fetchWeekPlan,
  createMealPlanEntry,
  deleteMealPlanEntry,
  type MealPlanEntryResponse,
} from '../api';
import { toLocalISODate } from '../lib/utils';

/** A single planned meal entry associating a date, meal slot, and recipe. */
export interface MealPlan {
  /** Backend MealPlanEntry.id — required for DELETE. */
  id: number;
  /** ISO date string (e.g., "2026-04-06"). */
  date: string;
  /** Which meal slot this entry occupies. */
  mealType: MealType;
  /** The recipe assigned to this slot. */
  recipe: Recipe;
  /** Per-serving calorie count as a decimal string, or null if nutrition data is unavailable. */
  calories: string | null;
  /** Per-serving protein in grams as a decimal string, or null if nutrition data is unavailable. */
  protein: string | null;
  /** Per-serving carbohydrates in grams as a decimal string, or null if nutrition data is unavailable. */
  carbs: string | null;
  /** Per-serving fat in grams as a decimal string, or null if nutrition data is unavailable. */
  fat: string | null;
}

/**
 * Daily aggregated macro totals computed from all planned meals on a given date.
 * All values are zero when no meals are planned or when recipe nutrition data is unavailable.
 */
export interface DailyMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlanningContextType {
  mealPlans: MealPlan[];
  /** True while the current week is being fetched from the backend. */
  isLoading: boolean;
  /** Fetch and replace local state with the 7-day plan starting at weekStart. */
  loadWeek: (weekStart: Date) => Promise<void>;
  addMealPlan: (date: string, mealType: MealType, recipe: Recipe) => Promise<void>;
  removeMealPlan: (date: string, mealType: MealType) => Promise<void>;
  getMealPlansForDate: (date: string) => MealPlan[];
  getMealPlansForWeek: (startDate: Date) => Map<string, MealPlan[]>;
}

/** Maps a backend MealPlanEntryResponse to the frontend MealPlan shape. */
function entryToMealPlan(entry: MealPlanEntryResponse): MealPlan {
  return {
    id: entry.id,
    date: entry.date,
    mealType: entry.meal_slot as MealType,
    recipe: {
      id: String(entry.recipe.id),
      name: entry.recipe.name,
      image_1: entry.recipe.image_1 || undefined,
      dietary_tags: entry.recipe.dietary_tags,
      cuisine_type: entry.recipe.cuisine_type,
      // Not included in the lightweight meal plan response:
      description: '',
      ingredients: [],
      instructions: [],
    },
    calories: entry.recipe.calories,
    protein: entry.recipe.protein,
    carbs: entry.recipe.carbs,
    fat: entry.recipe.fat,
  };
}

/** Coerces a single MealPlan's macro strings to finite numbers (0 when unparseable). */
function coerceMacros(p: MealPlan): DailyMacros {
  const cal = parseFloat(p.calories ?? '');
  const pro = parseFloat(p.protein ?? '');
  const carb = parseFloat(p.carbs ?? '');
  const fat = parseFloat(p.fat ?? '');
  return {
    calories: Number.isFinite(cal) ? cal : 0,
    protein: Number.isFinite(pro) ? pro : 0,
    carbs: Number.isFinite(carb) ? carb : 0,
    fat: Number.isFinite(fat) ? fat : 0,
  };
}

/**
 * Aggregates macro totals for all meal plans on a given ISO date string.
 *
 * Pure function — no side effects, no network calls. Safe to call on every render.
 * `calories|protein|carbs|fat` on each `MealPlan` are Django Decimal strings or null;
 * any value that cannot be parsed to a finite number is silently treated as 0.
 */
export function aggregateMacrosForDate(
  plans: readonly MealPlan[],
  dateIso: string,
): DailyMacros {
  return plans.reduce<DailyMacros>(
    (acc, p) => {
      if (p.date !== dateIso) return acc;
      const m = coerceMacros(p);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/**
 * Aggregates macro totals across all 7 days of a week.
 *
 * Pure function — same guarantees as `aggregateMacrosForDate`.
 * Pass the ISO date strings for the 7 displayed days; any plan entry whose date is
 * not in that set is ignored.
 */
export function aggregateMacrosForWeek(
  plans: readonly MealPlan[],
  weekDateIsos: readonly string[],
): DailyMacros {
  const isoSet = new Set(weekDateIsos);
  return plans.reduce<DailyMacros>(
    (acc, p) => {
      if (!isoSet.has(p.date)) return acc;
      const m = coerceMacros(p);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

const MealPlanningContext = createContext<MealPlanningContextType | undefined>(undefined);

/** Provides meal planning state backed by the backend API to all descendant components. */
export function MealPlanningProvider({ children }: { children: ReactNode }) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Ref gives removeMealPlan a stable reference while always reading current mealPlans.
  const mealPlansRef = useRef<MealPlan[]>(mealPlans);
  mealPlansRef.current = mealPlans;

  /**
   * Fetches the 7-day week plan from the backend and replaces local state.
   * Uses the ISO date string of weekStart as the week_start query param.
   */
  const loadWeek = useCallback(async (weekStart: Date): Promise<void> => {
    setIsLoading(true);
    try {
      const weekStartStr = toLocalISODate(weekStart);
      const data = await fetchWeekPlan(weekStartStr);
      const loaded: MealPlan[] = [];
      for (const day of data.days) {
        for (const entry of Object.values(day.meals)) {
          if (entry !== null) {
            loaded.push(entryToMealPlan(entry));
          }
        }
      }
      setMealPlans(loaded);
    } catch (err) {
      console.error('[MealPlanning] Failed to load week:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * POSTs a new meal plan entry to the backend (upserts if the slot is occupied),
   * then updates local state with the server response.
   */
  const addMealPlan = useCallback(
    async (date: string, mealType: MealType, recipe: Recipe): Promise<void> => {
      const entry = await createMealPlanEntry(date, mealType, Number(recipe.id));
      const newPlan = entryToMealPlan(entry);
      setMealPlans((prev) => [
        ...prev.filter((p) => !(p.date === date && p.mealType === mealType)),
        newPlan,
      ]);
    },
    [],
  );

  /**
   * Looks up the entry ID from local state, DELETEs it on the backend,
   * then removes it from local state.
   */
  const removeMealPlan = useCallback(
    async (date: string, mealType: MealType): Promise<void> => {
      const entry = mealPlansRef.current.find(
        (p) => p.date === date && p.mealType === mealType,
      );
      if (!entry) return;
      await deleteMealPlanEntry(entry.id);
      setMealPlans((prev) =>
        prev.filter((p) => !(p.date === date && p.mealType === mealType)),
      );
    },
    [],
  );

  /** Returns all meal plans for a specific date. */
  const getMealPlansForDate = useCallback(
    (date: string): MealPlan[] => mealPlans.filter((p) => p.date === date),
    [mealPlans],
  );

  /**
   * Returns a Map of ISO date strings to meal plans for the 7-day week starting
   * at startDate. Keys are always present (value is [] when no meals planned).
   */
  const getMealPlansForWeek = useCallback(
    (startDate: Date): Map<string, MealPlan[]> => {
      const weekPlans = new Map<string, MealPlan[]>();
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateString = toLocalISODate(date);
        weekPlans.set(dateString, getMealPlansForDate(dateString));
      }
      return weekPlans;
    },
    [getMealPlansForDate],
  );

  return (
    <MealPlanningContext.Provider
      value={{
        mealPlans,
        isLoading,
        loadWeek,
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
