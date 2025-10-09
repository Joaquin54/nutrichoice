import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { AccountPage } from '../pages/AccountPage';
import { NutritionPage } from '../pages/NutritionPage';
import { MealPlanningPage } from '../pages/MealPlanningPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'auth',
        element: <AuthPage />,
      },
      {
        path: 'favorites',
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
    ],
  },
]);
