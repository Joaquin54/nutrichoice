import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { RecipeActionsProvider } from '../../hooks/useRecipeActions';
import { SocialActionsProvider } from '../../hooks/useSocialActions';
import { CookbooksProvider } from '../../hooks/useCookbooks';
import { MealPlanningProvider } from '../../hooks/useMealPlanning';

/**
 * Authenticated layout shell.
 * Data-fetching providers are mounted here (not in main.tsx) so that
 * unauthenticated routes (AuthPage, password reset) never trigger API calls.
 * RecipesProvider is no longer needed — useRecipes() is backed by TanStack Query
 * and handles its own deduplication and caching.
 */
export function Layout() {
  const location = useLocation();
  const isCookbookView = /^\/cookbooks\/[^/]+$/.test(location.pathname);

  return (
    <RecipeActionsProvider>
      <SocialActionsProvider>
        <CookbooksProvider>
          <MealPlanningProvider>
              <div
                className={
                  isCookbookView
                    ? 'flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#6ec257]/15 dark:bg-gray-900'
                    : 'flex min-h-[100dvh] flex-col bg-[#6ec257]/15 dark:bg-gray-900'
                }
              >
                {/* Single sticky stack: avoids nav sliding under/over header; header is opaque */}
                <div className="sticky top-0 z-40 shrink-0">
                  <Header />
                  <Navigation />
                </div>
                <main
                  className={
                    isCookbookView
                      ? 'mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden px-2 pb-[10px] pt-1 sm:max-w-page-sm md:max-w-page-md sm:px-4 xl:max-w-7xl 2xl:max-w-screen-2xl'
                      : 'mx-auto w-full max-w-full px-3 pt-2 pb-4 sm:max-w-page-sm sm:px-4 sm:py-6 md:max-w-page-md md:py-8 xl:max-w-7xl 2xl:max-w-screen-2xl'
                  }
                >
                  <Outlet />
                </main>
              </div>
          </MealPlanningProvider>
        </CookbooksProvider>
      </SocialActionsProvider>
    </RecipeActionsProvider>
  );
}
