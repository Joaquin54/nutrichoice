import { WeeklyCalendar } from '../components/mealPlanning';

export function MealPlanningPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meal Planning</h1>
        <p className="text-gray-600">
          Plan your meals for the week ahead
        </p>
      </div>

      <WeeklyCalendar />
    </div>
  );
}

