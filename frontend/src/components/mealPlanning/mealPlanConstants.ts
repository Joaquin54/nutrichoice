/**
 * Meal planning feature constants.
 *
 * Single source of truth for meal types, display labels, and color tokens.
 * All meal planning components import from here rather than defining their own maps.
 */

/** The five meal slots available in the weekly planner, in display order. */
export type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

/** Ordered array of meal types matching the grid row order (top to bottom). */
export const MEAL_TYPES: MealType[] = [
  'breakfast',
  'snack1',
  'lunch',
  'snack2',
  'dinner',
];

/**
 * Per-meal-type display and styling configuration.
 *
 * - `label`: Full display name shown in row labels and dialogs.
 * - `shortLabel`: Abbreviated uppercase label for compact row headers.
 * - `accentColor`: Bright accent hex used for text and progress bars.
 * - `dotClass`: Tailwind class for the colored indicator dot.
 * - `chipClasses`: Pre-composed Tailwind classes for filled meal chips —
 *   uses arbitrary-value pattern `bg-[hex]` with dark: variants, consistent
 *   with how `#6ec257` is used throughout the project.
 */
export interface MealTypeConfig {
  label: string;
  shortLabel: string;
  accentColor: string;
  dotClass: string;
  chipClasses: string;
}

export const MEAL_TYPE_CONFIG: Record<MealType, MealTypeConfig> = {
  breakfast: {
    label: 'Breakfast',
    shortLabel: 'BKFST',
    accentColor: '#c8f56a',
    dotClass: 'bg-[#c8f56a]',
    chipClasses:
      'bg-[#eaf8d0] dark:bg-[#1a2a18] text-[#4a7a20] dark:text-[#c8f56a] border border-[#c8f56a]/40 dark:border-[#c8f56a]/25',
  },
  snack1: {
    label: 'Snack 1',
    shortLabel: 'SNACK',
    accentColor: '#f5c842',
    dotClass: 'bg-[#f5c842]',
    chipClasses:
      'bg-[#fdf3d0] dark:bg-[#2a1f0e] text-[#7a6010] dark:text-[#f5c842] border border-[#f5c842]/40 dark:border-[#f5c842]/25',
  },
  lunch: {
    label: 'Lunch',
    shortLabel: 'LUNCH',
    accentColor: '#5bb8d4',
    dotClass: 'bg-[#5bb8d4]',
    chipClasses:
      'bg-[#d0eef8] dark:bg-[#0e1f28] text-[#1a6a80] dark:text-[#5bb8d4] border border-[#5bb8d4]/40 dark:border-[#5bb8d4]/25',
  },
  snack2: {
    label: 'Snack 2',
    shortLabel: 'SNK 2',
    accentColor: '#b89af5',
    dotClass: 'bg-[#b89af5]',
    chipClasses:
      'bg-[#e8ddf8] dark:bg-[#1e1428] text-[#5a3a8a] dark:text-[#b89af5] border border-[#b89af5]/40 dark:border-[#b89af5]/25',
  },
  dinner: {
    label: 'Dinner',
    shortLabel: 'DINR',
    accentColor: '#f58a8a',
    dotClass: 'bg-[#f58a8a]',
    chipClasses:
      'bg-[#fde0d0] dark:bg-[#28100e] text-[#8a2a2a] dark:text-[#f58a8a] border border-[#f58a8a]/40 dark:border-[#f58a8a]/25',
  },
};
