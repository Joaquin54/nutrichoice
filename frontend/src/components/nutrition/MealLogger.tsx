import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BarChart3 } from 'lucide-react';

interface MealLoggerProps {
  onLogMeal: () => void;
}

export function MealLogger({ onLogMeal }: MealLoggerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Meals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start logging your meals
          </h3>
          <p className="text-gray-600 mb-4">
            Track your nutrition by logging the recipes you cook and eat.
          </p>
          <Button className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white" onClick={onLogMeal}>Log Your First Meal</Button>
        </div>
      </CardContent>
    </Card>
  );
}
