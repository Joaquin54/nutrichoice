import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { DietaryFilter } from '../types/recipe';
import { getMyProfile, updateUserProfile, getAuthToken } from '../api';

interface UserPreferencesContextType {
  dietaryPreferences: DietaryFilter;
  isLoading: boolean;
  updateDietaryPreferences: (preferences: DietaryFilter) => Promise<void>;
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

function loadLocalPreferences(): DietaryFilter {
  try {
    const saved = localStorage.getItem('dietaryPreferences');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  // Initialise instantly from localStorage so there is no flash on load.
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryFilter>(
    loadLocalPreferences
  );
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate from backend on mount, overriding localStorage with the
  // authoritative server value (handles multi-device sync).
  useEffect(() => {
    if (!getAuthToken()) return;
    setIsLoading(true);
    getMyProfile()
      .then((profile) => {
        if (profile.diet_type && typeof profile.diet_type === 'object') {
          const dt = profile.diet_type as Record<string, boolean>;
          const prefs: DietaryFilter = {
            vegetarian: dt.vegetarian ?? false,
            vegan: dt.vegan ?? false,
            glutenFree: dt.glutenFree ?? false,
            dairyFree: dt.dairyFree ?? false,
            eggFree: dt.eggFree ?? false,
            pescatarian: dt.pescatarian ?? false,
            lowCarb: dt.lowCarb ?? false,
            keto: dt.keto ?? false,
          };
          setDietaryPreferences(prefs);
          localStorage.setItem('dietaryPreferences', JSON.stringify(prefs));
        }
      })
      .catch(() => {
        // Non-fatal — keep the localStorage value
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Persist to both localStorage and backend.
  const updateDietaryPreferences = useCallback(async (preferences: DietaryFilter) => {
    setDietaryPreferences(preferences);
    localStorage.setItem('dietaryPreferences', JSON.stringify(preferences));

    if (getAuthToken()) {
      try {
        await updateUserProfile({ diet_type: preferences });
      } catch {
        // Non-fatal — localStorage remains the local source of truth
      }
    }
  }, []);

  return (
    <UserPreferencesContext.Provider
      value={{ dietaryPreferences, isLoading, updateDietaryPreferences }}
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
