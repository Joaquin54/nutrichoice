import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { RecipeActionsProvider } from './hooks/useRecipeActions'
import { MealPlanningProvider } from './hooks/useMealPlanning'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RecipeActionsProvider>
      <MealPlanningProvider>
        <RouterProvider router={router} />
      </MealPlanningProvider>
    </RecipeActionsProvider>
  </StrictMode>,
)
