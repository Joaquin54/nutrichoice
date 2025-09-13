// Core recipe interface
export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dietaryTags: string[];
  ingredients: string[];
  instructions: string[];
  cuisine?: string;
  rating?: number;
  calories?: number;
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

// Utility types for future expansion
export type DietaryFilterKey = keyof DietaryFilter;
export type RecipeDifficulty = Recipe['difficulty'];
export type SortOption = 'title' | 'cookTime' | 'difficulty' | 'rating';
export type SortDirection = 'asc' | 'desc';

// Search and filter types
export interface SearchFilters {
  query: string;
  dietary: DietaryFilter;
  difficulty?: RecipeDifficulty;
  maxCookTime?: number;
  cuisine?: string;
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