import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { DietaryFilter } from '../types/recipe';

interface UserPreferencesContextType {
  dietaryPreferences: DietaryFilter;
  updateDietaryPreferences: (preferences: DietaryFilter) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: DietaryFilter = {
  vegetarian: false,
  vegan: false,
  glutenFree: false,
  dairyFree: false,
  eggFree: false,
  pescatarian: false,
  lowCarb: false,
  keto: false,
};

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryFilter>(() => {
    // Load preferences from localStorage on mount
    const saved = localStorage.getItem('dietaryPreferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse dietary preferences from localStorage', e);
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const updateDietaryPreferences = useCallback((preferences: DietaryFilter) => {
    setDietaryPreferences(preferences);
    // Save to localStorage
    localStorage.setItem('dietaryPreferences', JSON.stringify(preferences));
  }, []);

  return (
    <UserPreferencesContext.Provider
      value={{
        dietaryPreferences,
        updateDietaryPreferences,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}

