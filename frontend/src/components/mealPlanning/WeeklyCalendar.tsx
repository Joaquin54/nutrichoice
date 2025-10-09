import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useMealPlanning, type MealPlan } from '../../hooks/useMealPlanning';
import { RecipeSelector } from './RecipeSelector';

const MEAL_TYPES: Array<MealPlan['mealType']> = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_TYPE_COLORS = {
  breakfast: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  lunch: 'bg-blue-100 border-blue-300 text-blue-800',
  dinner: 'bg-purple-100 border-purple-300 text-purple-800',
  snack: 'bg-green-100 border-green-300 text-green-800',
};

export function WeeklyCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Start from Sunday
    return new Date(today.setDate(diff));
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealPlan['mealType'] | null>(null);

  const { getMealPlansForWeek, removeMealPlan } = useMealPlanning();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const weekPlans = getMealPlansForWeek(currentWeekStart);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const handleAddMeal = (dateString: string, mealType: MealPlan['mealType']) => {
    setSelectedDate(dateString);
    setSelectedMealType(mealType);
  };

  const handleCloseSelector = () => {
    setSelectedDate(null);
    setSelectedMealType(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Weekly Meal Plan</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[200px] text-center">
                {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date) => {
              const dateString = date.toISOString().split('T')[0];
              const dayPlans = weekPlans.get(dateString) || [];
              
              return (
                <div
                  key={dateString}
                  className={`border rounded-lg p-3 min-h-[400px] ${
                    isToday(date) ? 'bg-green-50 border-green-300' : 'bg-white'
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="font-semibold text-gray-900">{formatDayName(date)}</div>
                    <div className="text-sm text-gray-600">{formatDate(date)}</div>
                  </div>

                  <div className="space-y-2">
                    {MEAL_TYPES.map((mealType) => {
                      const meal = dayPlans.find((plan) => plan.mealType === mealType);

                      return (
                        <div key={mealType} className="space-y-1">
                          <div className="text-xs font-medium text-gray-500 capitalize">
                            {mealType}
                          </div>
                          {meal ? (
                            <div
                              className={`text-xs p-2 rounded border ${MEAL_TYPE_COLORS[mealType]} relative group`}
                            >
                              <div className="pr-6 line-clamp-2">{meal.recipe.title}</div>
                              <button
                                onClick={() => removeMealPlan(dateString, mealType)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove meal"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddMeal(dateString, mealType)}
                              className="w-full text-xs p-2 rounded border border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && selectedMealType && (
        <RecipeSelector
          date={selectedDate}
          mealType={selectedMealType}
          onClose={handleCloseSelector}
        />
      )}
    </>
  );
}

