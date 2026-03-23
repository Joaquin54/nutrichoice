import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { RecipeActionsProvider } from './hooks/useRecipeActions'
import { CookbooksProvider } from './hooks/useCookbooks'
import { MealPlanningProvider } from './hooks/useMealPlanning'
import { UserPreferencesProvider } from './hooks/useUserPreferences'
import { ThemeProvider } from './contexts/ThemeContext'
import { SocialActionsProvider } from './hooks/useSocialActions'
import { RecipesProvider } from './hooks/useRecipes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <UserPreferencesProvider>
        <RecipesProvider>
          <RecipeActionsProvider>
            <SocialActionsProvider>
              <CookbooksProvider>
                <MealPlanningProvider>
                  <RouterProvider router={router} />
                </MealPlanningProvider>
              </CookbooksProvider>
            </SocialActionsProvider>
          </RecipeActionsProvider>
        </RecipesProvider>
      </UserPreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
)