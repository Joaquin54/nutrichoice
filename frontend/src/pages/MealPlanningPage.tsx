import { WeeklyCalendar } from '../components/mealPlanning';

export function MealPlanningPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Meal Planning</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Plan your meals for the week ahead
        </p>
      </div>

      <WeeklyCalendar />
    </div>
  );
}

