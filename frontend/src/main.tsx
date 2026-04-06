import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from './router'
import { UserPreferencesProvider } from './hooks/useUserPreferences'
import { ThemeProvider } from './contexts/ThemeContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes before triggering a background refetch.
      staleTime: 5 * 60 * 1000,
      // Retain unused query data for 10 minutes before garbage collection.
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

// Data-fetching providers (RecipesProvider, RecipeActionsProvider, etc.) are
// mounted inside Layout so unauthenticated routes never trigger API calls.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserPreferencesProvider>
          <RouterProvider router={router} />
        </UserPreferencesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)