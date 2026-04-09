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
  gluten_free: false,
  dairy_free: false,
  nut_free: false,
  keto: false,
  paleo: false,
  low_carb: false,
};

function loadLocalPreferences(): DietaryFilter {
  try {
    const saved = localStorage.getItem('dietaryPreferences');
    if (!saved) return DEFAULT_PREFERENCES;

    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return DEFAULT_PREFERENCES;
    }

    // Sanitize: drop unknown keys (handles stale camelCase values from prior versions)
    // and fill any missing canonical keys with false.
    const raw = parsed as Record<string, unknown>;
    const sanitized: DietaryFilter = { ...DEFAULT_PREFERENCES };
    for (const key of Object.keys(DEFAULT_PREFERENCES) as Array<keyof DietaryFilter>) {
      if (typeof raw[key] === 'boolean') {
        sanitized[key] = raw[key] as boolean;
      }
      // Unknown or non-boolean values fall back to the DEFAULT_PREFERENCES value (false)
    }
    return sanitized;
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
        if (profile.diet_type === null) {
          // diet_type is null: user skipped onboarding — keep default state and
          // write DEFAULT_PREFERENCES to localStorage so the UI is stable.
          setDietaryPreferences(DEFAULT_PREFERENCES);
          localStorage.setItem('dietaryPreferences', JSON.stringify(DEFAULT_PREFERENCES));
        } else if (typeof profile.diet_type === 'object') {
          // diet_type is a populated or empty dict — map each canonical key.
          const dt = profile.diet_type as Record<string, boolean>;
          const prefs: DietaryFilter = {
            vegetarian: dt.vegetarian ?? false,
            vegan: dt.vegan ?? false,
            gluten_free: dt.gluten_free ?? false,
            dairy_free: dt.dairy_free ?? false,
            nut_free: dt.nut_free ?? false,
            keto: dt.keto ?? false,
            paleo: dt.paleo ?? false,
            low_carb: dt.low_carb ?? false,
          };
          setDietaryPreferences(prefs);
          localStorage.setItem('dietaryPreferences', JSON.stringify(prefs));
        } else {
          // Unexpected shape — fall back to defaults and do not overwrite localStorage.
          setDietaryPreferences(DEFAULT_PREFERENCES);
        }
      })
      .catch(() => {
        // Non-fatal — keep the localStorage value
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Persist to both localStorage and backend.
  const updateDietaryPreferences = useCallback(async (preferences: DietaryFilter) => {
    // Local state and localStorage always store the full DietaryFilter object
    // (even when all-false) so the UI remains stable and checkbox state is preserved.
    setDietaryPreferences(preferences);
    localStorage.setItem('dietaryPreferences', JSON.stringify(preferences));

    if (getAuthToken()) {
      try {
        // When all boxes are unchecked, send null to the API (signals "no preference")
        // rather than {}, while keeping local state as all-false dict for UI stability.
        const allFalse = Object.values(preferences).every((v) => v === false);
        await updateUserProfile({ diet_type: allFalse ? null : preferences });
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
