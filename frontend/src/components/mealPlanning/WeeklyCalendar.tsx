import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useMealPlanning, type MealPlan } from '../../hooks/useMealPlanning';
import { RecipeSelector } from './RecipeSelector';

const MEAL_TYPES: Array<MealPlan['mealType']> = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_TYPE_COLORS = {
  breakfast: 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
  lunch: 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  dinner: 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200',
  snack: 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 border-[#6ec257]/40 dark:border-[#6ec257]/50 text-[#6ec257] dark:text-[#6ec257]/90',
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
        <CardHeader className="px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <CardTitle className="text-xl sm:text-2xl">Weekly Meal Plan</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={goToCurrentWeek} className="text-xs sm:text-sm">
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousWeek} className="h-8 w-8 sm:h-10 sm:w-10">
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium flex-1 sm:min-w-[200px] text-center text-gray-900 dark:text-white">
                {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextWeek} className="h-8 w-8 sm:h-10 sm:w-10">
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-7 gap-2 overflow-x-auto sm:overflow-x-visible">
            {weekDays.map((date) => {
              const dateString = date.toISOString().split('T')[0];
              const dayPlans = weekPlans.get(dateString) || [];
              
              return (
                <div
                  key={dateString}
                  className={`border rounded-lg p-2 sm:p-3 min-h-[300px] sm:min-h-[400px] min-w-[120px] sm:min-w-0 ${
                    isToday(date) 
                      ? 'bg-[#6ec257]/10 dark:bg-[#6ec257]/20 border-[#6ec257]/40 dark:border-[#6ec257]/50' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-center mb-2 sm:mb-3">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{formatDayName(date)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{formatDate(date)}</div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {MEAL_TYPES.map((mealType) => {
                      const meal = dayPlans.find((plan) => plan.mealType === mealType);

                      return (
                        <div key={mealType} className="space-y-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
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
                              className="w-full text-xs p-2 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:border-[#6ec257] dark:hover:border-[#6ec257]/70 hover:bg-[#6ec257]/10 dark:hover:bg-[#6ec257]/20 transition-colors flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400"
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

