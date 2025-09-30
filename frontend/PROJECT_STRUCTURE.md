# NutriChoice Frontend Project Structure

## Overview
This document outlines the organized structure of the NutriChoice React frontend application, following React best practices for a recipe recommendation app.

## Directory Structure

```
src/
├── components/           # Reusable UI components organized by feature
│   ├── auth/            # Authentication-related components
│   ├── common/          # Shared/common components
│   │   ├── HeroSection.tsx
│   │   └── SearchBar.tsx
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   │   ├── Header.tsx   # Site header with logo and user menu
│   │   ├── Layout.tsx   # Main layout wrapper
│   │   └── Navigation.tsx # Main navigation menu
│   ├── nutrition/       # Nutrition tracking components
│   ├── recipe/          # Recipe-related components
│   │   ├── DietaryPreferences.tsx
│   │   ├── RecipeCard.tsx
│   │   └── RecipeModal.tsx
│   └── ui/              # Base UI components (shadcn/ui)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── CookingIcons.tsx
│       ├── dialog.tsx
│       ├── ImageWithFallback.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       └── slider.tsx
├── data/                # Static data and mock data
│   └── mockRecipes.ts
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   └── utils.ts
├── pages/               # Page components (one per route)
│   ├── AccountPage.tsx  # User account settings
│   ├── AuthPage.tsx     # Authentication (login/signup)
│   ├── FavoritesPage.tsx # User's favorite recipes
│   ├── HomePage.tsx     # Main homepage with recipe discovery
│   └── NutritionPage.tsx # Nutrition tracking dashboard
├── router/              # Routing configuration
│   └── index.tsx        # React Router setup
├── types/               # TypeScript type definitions
│   └── recipe.ts
├── utils/               # Utility functions
├── App.tsx              # Main app component (simplified)
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Key Features Implemented

### 1. Routing Structure
- **Homepage (`/`)**: Recipe discovery with search and filtering
- **Authentication (`/auth`)**: Login and signup forms
- **Favorites (`/favorites`)**: User's saved recipes
- **Account (`/account`)**: User profile and preferences
- **Nutrition (`/nutrition`)**: Nutrition tracking dashboard

### 2. Layout Components
- **Header**: Site branding, logo, and user menu
- **Navigation**: Main navigation with active state indicators
- **Layout**: Wrapper component with consistent styling

### 3. Page Components
Each page is a self-contained component with its own state and functionality:
- **HomePage**: Preserves all existing recipe discovery functionality
- **AuthPage**: Basic login/signup forms with toggle
- **FavoritesPage**: Placeholder for saved recipes
- **AccountPage**: User settings organized in cards
- **NutritionPage**: Nutrition tracking with progress indicators

### 4. Component Organization
Components are organized by feature/domain:
- **recipe/**: Recipe-related components
- **auth/**: Authentication components
- **nutrition/**: Nutrition tracking components
- **layout/**: Layout and navigation
- **ui/**: Base UI components (shadcn/ui)
- **common/**: Shared components

## Best Practices Followed

1. **Feature-based Organization**: Components grouped by domain/feature
2. **Separation of Concerns**: Pages handle routing, components handle UI
3. **Reusable Components**: UI components in dedicated folder
4. **TypeScript**: Strong typing throughout
5. **Consistent Styling**: Tailwind CSS with consistent design system
6. **Accessibility**: Proper semantic HTML and ARIA attributes

## Next Steps

1. **Authentication Integration**: Connect auth forms to backend
2. **State Management**: Add Redux/Zustand for global state
3. **API Integration**: Connect to backend services
4. **Testing**: Add unit and integration tests
5. **Performance**: Add lazy loading and optimization
6. **PWA Features**: Add offline support and caching

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Dependencies

- **React 19**: Latest React with concurrent features
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **TypeScript**: Type safety and better DX
