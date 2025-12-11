import { useState } from 'react';
import { 
  DailyOverview, 
  GoalsCard, 
  WeeklyProgress, 
  MealLogger 
} from '../components/nutrition';

export function NutritionPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app, this would come from API/context
  const dailyData = {
    calories: { current: 1250, target: 2000 },
    protein: { current: 85, target: 120 },
    carbs: { current: 150, target: 250 },
    fat: { current: 45, target: 65 },
  };

  const goals = [
    {
      id: '1',
      name: 'Weight Loss',
      status: 'on-track' as const,
      progress: '-2.5 lbs this month',
      color: 'green' as const,
    },
    {
      id: '2',
      name: 'Muscle Gain',
      status: 'in-progress' as const,
      progress: '+0.8 lbs this month',
      color: 'blue' as const,
    },
    {
      id: '3',
      name: 'Energy Levels',
      status: 'on-track' as const,
      progress: 'Consistent energy',
      color: 'purple' as const,
    },
  ];

  const weeklyData = {
    avgDailyCalories: 1850,
    mealsLogged: '18/21',
    waterIntake: '6.2L avg',
    exerciseDays: '4/7',
  };

  const handleUpdateGoals = async () => {
    setIsLoading(true);
    // TODO: Implement goals update logic
    console.log('Updating goals...');
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleViewReport = () => {
    // TODO: Navigate to detailed report or open modal
    console.log('Viewing detailed report...');
  };

  const handleLogMeal = () => {
    // TODO: Open meal logging modal or navigate to meal logger
    console.log('Opening meal logger...');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Nutrition Tracking</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Monitor your nutritional intake and health goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <DailyOverview data={dailyData} />
        
        <GoalsCard 
          goals={goals}
          onUpdateGoals={handleUpdateGoals}
          isLoading={isLoading}
        />
        
        <WeeklyProgress 
          data={weeklyData}
          onViewReport={handleViewReport}
        />
      </div>

      <MealLogger onLogMeal={handleLogMeal} />
    </div>
  );
}
