import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { AuthPage } from '../pages/AuthPage';

// Lazy-load all authenticated page components so each route is only
// bundled and parsed when the user first navigates to it.
const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const AccountPage = lazy(() => import('../pages/AccountPage').then(m => ({ default: m.AccountPage })));
const NutritionPage = lazy(() => import('../pages/NutritionPage').then(m => ({ default: m.NutritionPage })));
const MealPlanningPage = lazy(() => import('../pages/MealPlanningPage').then(m => ({ default: m.MealPlanningPage })));
const RecipeFeedPage = lazy(() => import('../pages/RecipeFeedPage').then(m => ({ default: m.RecipeFeedPage })));
const CookbooksPage = lazy(() => import('../pages/CookbooksPage').then(m => ({ default: m.CookbooksPage })));
const CookbookViewPage = lazy(() => import('../pages/CookbookViewPage').then(m => ({ default: m.CookbookViewPage })));
const PasswordResetRequestPage = lazy(() =>
  import('../pages/PasswordResetRequestPage').then(m => ({ default: m.PasswordResetRequestPage }))
);
const PasswordResetConfirmPage = lazy(() =>
  import('../pages/PasswordResetConfirmPage').then(m => ({ default: m.PasswordResetConfirmPage }))
);
const PasswordChangePage = lazy(() =>
  import('../pages/PasswordChangePage').then(m => ({ default: m.PasswordChangePage }))
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-[#6ec257]" />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthPage />,
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PasswordResetRequestPage />
      </Suspense>
    ),
  },
  {
    path: '/reset-password/confirm',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PasswordResetConfirmPage />
      </Suspense>
    ),
  },
  {
    path: '/change-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PasswordChangePage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'home',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'favorites',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FavoritesPage />
          </Suspense>
        ),
      },
      {
        path: 'my-recipes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FavoritesPage />
          </Suspense>
        ),
      },
      {
        path: 'account',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AccountPage />
          </Suspense>
        ),
      },
      {
        path: 'nutrition',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NutritionPage />
          </Suspense>
        ),
      },
      {
        path: 'meal-planning',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MealPlanningPage />
          </Suspense>
        ),
      },
      {
        path: 'recipe-feed',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecipeFeedPage />
          </Suspense>
        ),
      },
      {
        path: 'cookbooks',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CookbooksPage />
          </Suspense>
        ),
      },
      {
        path: 'cookbooks/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CookbookViewPage />
          </Suspense>
        ),
      },
    ],
  },
]);
