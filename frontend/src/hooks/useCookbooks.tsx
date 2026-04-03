import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import type { Cookbook } from '../types/recipe';
import {
  getCookbooks,
  getCookbookDetail,
  createCookbook as apiCreateCookbook,
  updateCookbook as apiUpdateCookbook,
  deleteCookbook as apiDeleteCookbook,
  addRecipeToCookbook as apiAddRecipeToCookbook,
  removeRecipeFromCookbook as apiRemoveRecipeFromCookbook,
  getAuthToken,
  type ApiCookbook,
} from '../api';

function mapApiCookbook(cb: ApiCookbook): Cookbook {
  return {
    id: cb.public_id,
    name: cb.name,
    recipeIds: [],
    recipeCount: cb.recipe_count,
    createdAt: cb.date_created,
  };
}

interface CookbooksContextType {
  cookbooks: Cookbook[];
  isLoading: boolean;
  error: string | null;
  createCookbook: (name: string, description?: string) => Promise<Cookbook>;
  updateCookbook: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
  deleteCookbook: (id: string) => Promise<void>;
  addRecipeToCookbook: (cookbookId: string, recipeId: string) => Promise<void>;
  removeRecipeFromCookbook: (cookbookId: string, recipeId: string) => Promise<void>;
  reorderRecipes: (cookbookId: string, recipeIds: string[]) => void;
  getCookbook: (id: string) => Cookbook | undefined;
  fetchCookbookDetail: (id: string) => Promise<void>;
}

const CookbooksContext = createContext<CookbooksContextType | undefined>(undefined);

export function CookbooksProvider({ children }: { children: ReactNode }) {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track which cookbooks have already had their detail fetched so we
  // don't redundantly re-fetch on repeated getCookbook calls.
  const detailFetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!getAuthToken()) return;
    setIsLoading(true);
    getCookbooks()
      .then((list) => setCookbooks(list.map(mapApiCookbook)))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const createCookbook = useCallback(async (name: string, description?: string): Promise<Cookbook> => {
    const created = await apiCreateCookbook(name, description);
    const cookbook = mapApiCookbook(created);
    setCookbooks((prev) => [...prev, cookbook]);
    return cookbook;
  }, []);

  const updateCookbook = useCallback(
    async (id: string, updates: { name?: string }) => {
      if (!updates.name) return;
      const updated = await apiUpdateCookbook(id, updates.name);
      setCookbooks((prev) =>
        prev.map((cb) =>
          cb.id === id ? { ...cb, name: updated.name } : cb
        )
      );
    },
    []
  );

  const deleteCookbook = useCallback(async (id: string) => {
    await apiDeleteCookbook(id);
    setCookbooks((prev) => prev.filter((cb) => cb.id !== id));
    detailFetched.current.delete(id);
  }, []);

  const addRecipeToCookbook = useCallback(
    async (cookbookId: string, recipeId: string) => {
      const numericId = parseInt(recipeId, 10);
      if (isNaN(numericId)) return;

      let optimisticApplied = false;
      setCookbooks((prev) => {
        const cb = prev.find((c) => c.id === cookbookId);
        if (!cb || cb.recipeIds.includes(recipeId)) return prev;
        optimisticApplied = true;
        return prev.map((c) =>
          c.id === cookbookId
            ? {
                ...c,
                recipeIds: [...c.recipeIds, recipeId],
                recipeCount: c.recipeCount + 1,
              }
            : c
        );
      });

      try {
        const detail = await apiAddRecipeToCookbook(cookbookId, numericId);
        const recipeIds = detail.recipes.map((r) => String(r.id));
        setCookbooks((prev) =>
          prev.map((cb) =>
            cb.id === cookbookId
              ? { ...cb, recipeIds, recipeCount: detail.recipe_count }
              : cb
          )
        );
        detailFetched.current.add(cookbookId);
      } catch (e) {
        if (optimisticApplied) {
          setCookbooks((prev) =>
            prev.map((cb) =>
              cb.id === cookbookId
                ? {
                    ...cb,
                    recipeIds: cb.recipeIds.filter((id) => id !== recipeId),
                    recipeCount: Math.max(0, cb.recipeCount - 1),
                  }
                : cb
            )
          );
        }
        throw e;
      }
    },
    []
  );

  const removeRecipeFromCookbook = useCallback(
    async (cookbookId: string, recipeId: string) => {
      const numericId = parseInt(recipeId, 10);
      if (isNaN(numericId)) return;
      await apiRemoveRecipeFromCookbook(cookbookId, numericId);
      setCookbooks((prev) =>
        prev.map((cb) =>
          cb.id === cookbookId
            ? {
                ...cb,
                recipeIds: cb.recipeIds.filter((id) => id !== recipeId),
                recipeCount: Math.max(0, cb.recipeCount - 1),
              }
            : cb
        )
      );
    },
    []
  );

  // Local-only reorder — no backend endpoint exists for this.
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

  const fetchCookbookDetail = useCallback(
    async (id: string) => {
      if (detailFetched.current.has(id)) return;
      try {
        const detail = await getCookbookDetail(id);
        const recipeIds = detail.recipes.map((r) => String(r.id));
        setCookbooks((prev) =>
          prev.map((cb) =>
            cb.id === id
              ? { ...cb, recipeIds, recipeCount: detail.recipe_count }
              : cb
          )
        );
        detailFetched.current.add(id);
      } catch {
        // Non-fatal — page will show empty cookbook
      }
    },
    []
  );

  return (
    <CookbooksContext.Provider
      value={{
        cookbooks,
        isLoading,
        error,
        createCookbook,
        updateCookbook,
        deleteCookbook,
        addRecipeToCookbook,
        removeRecipeFromCookbook,
        reorderRecipes,
        getCookbook,
        fetchCookbookDetail,
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
