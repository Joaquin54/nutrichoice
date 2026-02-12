import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import type { Cookbook } from '../types/recipe';

const STORAGE_KEY = 'nutrichoice_cookbooks';

function loadCookbooks(): Cookbook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCookbooks(cookbooks: Cookbook[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cookbooks));
}

function generateId(): string {
  return `cb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface CookbooksContextType {
  cookbooks: Cookbook[];
  createCookbook: (name: string, description?: string) => Cookbook;
  updateCookbook: (id: string, updates: { name?: string; description?: string }) => void;
  deleteCookbook: (id: string) => void;
  addRecipeToCookbook: (cookbookId: string, recipeId: string) => void;
  removeRecipeFromCookbook: (cookbookId: string, recipeId: string) => void;
  reorderRecipes: (cookbookId: string, recipeIds: string[]) => void;
  getCookbook: (id: string) => Cookbook | undefined;
}

const CookbooksContext = createContext<CookbooksContextType | undefined>(undefined);

export function CookbooksProvider({ children }: { children: ReactNode }) {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);

  useEffect(() => {
    setCookbooks(loadCookbooks());
  }, []);

  useEffect(() => {
    if (cookbooks.length > 0) saveCookbooks(cookbooks);
  }, [cookbooks]);

  const createCookbook = useCallback((name: string, description?: string): Cookbook => {
    const newCookbook: Cookbook = {
      id: generateId(),
      name,
      description,
      recipeIds: [],
      createdAt: new Date().toISOString(),
    };
    setCookbooks((prev) => [...prev, newCookbook]);
    return newCookbook;
  }, []);

  const updateCookbook = useCallback(
    (id: string, updates: { name?: string; description?: string }) => {
      setCookbooks((prev) =>
        prev.map((cb) =>
          cb.id === id
            ? {
                ...cb,
                ...(updates.name !== undefined && { name: updates.name }),
                ...(updates.description !== undefined && { description: updates.description }),
              }
            : cb
        )
      );
    },
    []
  );

  const deleteCookbook = useCallback((id: string) => {
    setCookbooks((prev) => prev.filter((cb) => cb.id !== id));
  }, []);

  const addRecipeToCookbook = useCallback((cookbookId: string, recipeId: string) => {
    setCookbooks((prev) =>
      prev.map((cb) =>
        cb.id === cookbookId && !cb.recipeIds.includes(recipeId)
          ? { ...cb, recipeIds: [...cb.recipeIds, recipeId] }
          : cb
      )
    );
  }, []);

  const removeRecipeFromCookbook = useCallback((cookbookId: string, recipeId: string) => {
    setCookbooks((prev) =>
      prev.map((cb) =>
        cb.id === cookbookId
          ? { ...cb, recipeIds: cb.recipeIds.filter((id) => id !== recipeId) }
          : cb
      )
    );
  }, []);

  const reorderRecipes = useCallback((cookbookId: string, recipeIds: string[]) => {
    setCookbooks((prev) =>
      prev.map((cb) =>
        cb.id === cookbookId ? { ...cb, recipeIds } : cb
      )
    );
  }, []);

  const getCookbook = useCallback(
    (id: string) => cookbooks.find((cb) => cb.id === id),
    [cookbooks]
  );

  return (
    <CookbooksContext.Provider
      value={{
        cookbooks,
        createCookbook,
        updateCookbook,
        deleteCookbook,
        addRecipeToCookbook,
        removeRecipeFromCookbook,
        reorderRecipes,
        getCookbook,
      }}
    >
      {children}
    </CookbooksContext.Provider>
  );
}

export function useCookbooks() {
  const context = useContext(CookbooksContext);
  if (context === undefined) {
    throw new Error('useCookbooks must be used within a CookbooksProvider');
  }
  return context;
}
