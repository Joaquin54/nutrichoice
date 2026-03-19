import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { AccountPage } from '../pages/AccountPage';
import { NutritionPage } from '../pages/NutritionPage';
import { MealPlanningPage } from '../pages/MealPlanningPage';
import { RecipeFeedPage } from '../pages/RecipeFeedPage';
import { CookbooksPage } from '../pages/CookbooksPage';
import { CookbookViewPage } from '../pages/CookbookViewPage';
import { PasswordResetRequestPage } from '../pages/PasswordResetRequestPage';
import { PasswordResetConfirmPage } from '../pages/PasswordResetConfirmPage';
import { PasswordChangePage } from '../pages/PasswordChangePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthPage />,
  },
  {
    path: '/reset-password',
    element: <PasswordResetRequestPage />,
  },
  {
    path: '/reset-password/confirm',
    element: <PasswordResetConfirmPage />,
  },
  {
    path: '/change-password',
    element: <PasswordChangePage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'favorites',
        element: <FavoritesPage />,
      },
      {
        path: 'my-recipes',
        element: <FavoritesPage />,
      },
      {
        path: 'account',
        element: <AccountPage />,
      },
      {
        path: 'nutrition',
        element: <NutritionPage />,
      },
      {
        path: 'meal-planning',
        element: <MealPlanningPage />,
      },
      {
        path: 'recipe-feed',
        element: <RecipeFeedPage />,
      },
      {
        path: 'cookbooks',
        element: <CookbooksPage />,
      },
      {
        path: 'cookbooks/:id',
        element: <CookbookViewPage />,
      },
    ],
  },
]);