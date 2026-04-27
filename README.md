# NutriChoice

NutriChoice is a full-stack web application for recipe discovery, meal planning, and nutrition tracking. Users can browse and save recipes, build cookbooks, log daily meals, monitor macronutrient goals, and plan their week with a weekly meal grid.

## Team

- Joaquin Frangi
- Isabella Correa
- Pedro Remoir
- Luis Duque
- Catalina Cisneros

## Tech Stack

- Frontend: React 19, TypeScript, Vite, TailwindCSS, React Router v7
- Backend: Django 5.2, Django REST Framework
- Database: PostgreSQL (Supabase)
- Deployment: Docker Compose, Render

## Running Locally

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Full stack via Docker:
```bash
docker-compose up
```

## Directory Structure

```
nutrichoice/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── account/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── cookbook/
│   │   │   ├── favorites/
│   │   │   ├── layout/
│   │   │   ├── mealPlanning/
│   │   │   ├── nutrition/
│   │   │   ├── recipe/
│   │   │   └── ui/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── data/
│   │   ├── lib/
│   │   ├── api.ts
│   │   └── main.tsx
│   ├── index.html
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/
│   ├── server/
│   ├── api/
│   │   ├── views/
│   │   └── serializers/
│   ├── users/
│   ├── profiles/
│   ├── recipes/
│   ├── ingredients/
│   ├── nutrition/
│   ├── social/
│   ├── meal_planning/
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── Dockerfile
├── docker-compose.yml
├── render.yaml
└── README.md
```

## Frontend

### src/api.ts

Centralized API request layer. All authenticated requests route through `authenticatedFetch()`, which attaches the `Token <token>` header from localStorage. Unauthenticated endpoints such as login, registration, and password reset use plain `fetch`.

### src/main.tsx

Application entry point. Composes all context providers in the following order from outermost to innermost: `ThemeProvider`, `UserPreferencesProvider`, `RecipesProvider`, `RecipeActionsProvider`, `SocialActionsProvider`, `CookbooksProvider`, `MealPlanningProvider`.

### src/components

Feature-based component organization. Each subfolder corresponds to a distinct area of the application.

**account** - Components for the user account page. Includes `ProfileForm` for editing personal details, `DietaryPreferencesCard` for managing dietary restrictions, `SecuritySettings` and `NotificationSettings` for account configuration, and `SocialStats` and `SocialModal` for displaying follower and following information.

**auth** - Authentication UI. Contains `LoginForm`, `SignupForm`, `AuthToggle`, `RegistrationModal`, and three password-related forms covering change, reset request, and reset confirmation flows.

**common** - Shared presentational components used across multiple features. Contains `HeroSection` for the landing page banner and `ResultsHeader` for displaying search or filter result counts.

**cookbook** - Cookbook management components. `CookbookBookshelf` renders the visual bookshelf layout. `CookbookRecipeSelector` handles adding recipes to a cookbook. `cookbookShelfColors.ts` defines the color palette for shelf rendering.

**favorites** - Components for the favorites page. `FavoritesGrid` displays saved recipes in a grid layout. `EmptyFavorites` renders the empty state.

**layout** - Application shell components. `Layout.tsx` wraps all authenticated pages. `Header.tsx` contains the top navigation bar. `Navigation.tsx` handles the sidebar or nav link structure.

**mealPlanning** - Weekly meal planner components. `MealGrid` is the primary grid view. `MealCell` and `MealRowLabel` handle individual cell rendering. `DayHeader` labels each column. `MacroStrip` and `MacroCard` display per-day macro summaries. `WeekNavigator` handles week-to-week navigation. `RecipeSelector` is the modal for picking a recipe to place in a slot. `mealPlanConstants.ts` defines meal row labels and related constants.

**nutrition** - Nutrition dashboard components. `DailyOverview` summarizes the current day's intake. `GoalsCard` displays the user's macro targets. `MealLogger` handles logging individual meals. `WeeklyProgress` renders a chart of intake across the week.

**recipe** - Recipe browsing and creation components. `RecipeCard` is the card used in grids and feeds. `RecipeModal` is the full detail view. `CreateRecipeModal` handles user-submitted recipes. `RecipeReviewsModal` shows ratings and reviews. `CuisineFilter` and `DietaryPreferencesDropdown` are filter controls. `IngredientInput` and `IngredientListItem` manage ingredient entry during recipe creation. `AddToCookbookPopover` handles adding a recipe to a cookbook from the card. `ImageUploadGrid` and `RecipeFeedDesktopCarouselFrame` handle image display in the feed.

**ui** - Base component library built on Radix UI primitives and wrapped with shadcn/ui patterns. Contains `accordion`, `badge`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `popover`, `select`, `slider`, `tabs`, `ImageWithFallback`, and `CookingIcons`. Variants are managed with `class-variance-authority` and class merging uses `clsx` combined with `tailwind-merge`.

### src/contexts

Contains `ThemeContext.tsx`, which exports `ThemeProvider` and the `useTheme` hook. It reads the user's theme preference from localStorage, falls back to the system `prefers-color-scheme` value, and listens for system-level changes when no manual preference is set.

### src/hooks

Custom React hooks that also serve as context providers. Each hook encapsulates a domain of state and is paired with a corresponding provider registered in `main.tsx`. Includes `useRecipes`, `useRecipeActions`, `useRecipeFeed`, `useRecipeLookup`, `useCookbooks`, `useMealPlanning`, `useSocialActions`, `useUserPreferences`, and `useSupabaseUpload`.

### src/pages

Page-level route components. Each page acts as an orchestrator, composing feature components without containing business logic directly. Pages include `AuthPage`, `HomePage`, `RecipeFeedPage`, `FavoritesPage`, `CookbooksPage`, `CookbookViewPage`, `MealPlanningPage`, `NutritionPage`, `AccountPage`, `PasswordChangePage`, `PasswordResetRequestPage`, and `PasswordResetConfirmPage`.

### src/router

Contains `index.tsx`, which defines all application routes. The root path `/` is declared twice: once for `AuthPage` with no layout wrapper, and once as a layout shell wrapping all authenticated pages.

### src/types

Centralized TypeScript type definitions. The primary file is `recipe.ts`, which defines both the `ApiRecipe` shape returned by the backend and the flattened frontend `Recipe` type. The conversion between the two is handled by `apiRecipeToRecipe()` in `api.ts`.

### src/utils

Utility functions shared across the application.

### src/data

Static data used throughout the app such as cuisine lists and dietary tag definitions.

### src/lib

Low-level library helpers, including the `cn()` class merging utility.

## Backend

### server/

Django project configuration. Contains `settings.py`, the root `urls.py`, and the WSGI and ASGI entry points.

### api/

The primary Django app. All routes are registered in `api/urls.py` under the `/api/` prefix. Explicit paths are declared before `router.urls` to prevent ViewSet detail patterns from intercepting named endpoints. Authentication uses DRF token auth with the `Token <token>` header format.

**api/views/** - View modules split by domain. Each file corresponds to a feature area: `recipes.py`, `nutrition.py`, `social.py`, `profiles.py`, `users.py`, `ingredients.py`, `meal_planning.py`, `feed.py`, `lookup.py`, `storage.py`, and `health.py`.

**api/serializers/** - Serializer modules split by domain, mirroring the views structure. Each file handles input validation and output formatting for its respective models.

### users/

Custom user model extending Django's base user. Handles authentication identity.

### profiles/

User profile data including display name, avatar, bio, and dietary preferences. Linked one-to-one with the user model.

### recipes/

Recipe models, management commands for seeding data, a `services/` directory for business logic, `signals.py` for post-save hooks, and a `utils/` directory for recipe-related helpers.

### ingredients/

Ingredient models and management commands for populating the ingredient database.

### nutrition/

Nutrition log models for tracking daily meal entries. Contains a `services/` directory for macro calculation logic and management commands.

### social/

Models and services for the social graph. Handles follows, likes, and any user-to-user interaction data.

### meal_planning/

Weekly meal plan models and a `services/` directory for meal plan business logic including macro aggregation per day.

## Environment Variables

Backend (place in `backend/.env`):

- `DJANGO_SECRET_KEY`
- `DEBUG`
- `SUPABASE_DB_*` (host, port, name, user, password)

Frontend (place in `frontend/.env`):

- `VITE_API_URL` (example: `http://localhost:8000/`)
