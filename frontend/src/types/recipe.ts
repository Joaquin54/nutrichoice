// Recipe review from a user
export interface RecipeReview {
  id: string;
  recipeId: string;
  userId: string;
  username: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO date string
}

// Core recipe interface — field names match the backend API
export interface Recipe {
  id: string;
  name: string;
  description: string;
  image?: string;
  dietary_tags: string[];
  ingredients: string[];
  instructions: string[];
  cuisine_type?: string;
  creator?: string;   // username of the recipe author (from backend)
  rating?: number;    // frontend/mock only — not stored in backend
}

// Dietary filter interface
export interface DietaryFilter {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  eggFree: boolean;
  pescatarian: boolean;
  lowCarb: boolean;
  keto: boolean;
}

// Cuisine filter interface
export interface CuisineFilter {
  italian: boolean;
  french: boolean;
  mexican: boolean;
  american: boolean;
  japanese: boolean;
  chinese: boolean;
  indian: boolean;
  thai: boolean;
  mediterranean: boolean;
  korean: boolean;
}

// Component prop types
export interface RecipeCardProps {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
}

export interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}


export interface DietaryPreferencesProps {
  filters: DietaryFilter;
  onFiltersChange: (filters: DietaryFilter) => void;
}

// Utility types
export type DietaryFilterKey = keyof DietaryFilter;
export type SortOption = 'name' | 'rating';
export type SortDirection = 'asc' | 'desc';

// Search and filter types
export interface SearchFilters {
  query: string;
  dietary: DietaryFilter;
  cuisine_type?: string;
}

// Future expansion types
export interface User {
  id: string;
  name: string;
  email: string;
  favoriteRecipes: string[];
  dietaryRestrictions: DietaryFilter;
}

export interface RecipeCollection {
  id: string;
  name: string;
  description: string;
  recipes: Recipe[];
  createdBy: string;
  isPublic: boolean;
}

// User cookbook: a named collection of recipe IDs (like a real cookbook)
export interface Cookbook {
  id: string;        // maps to backend public_id
  name: string;
  description?: string;
  recipeIds: string[];   // backend recipe IDs as strings; empty until detail is fetched
  recipeCount: number;   // authoritative count from backend recipe_count
  createdAt: string;
  /** Full recipes from GET /cookbooks/:id/; avoids relying on the paginated global recipe list. */
  recipes?: Recipe[];
}