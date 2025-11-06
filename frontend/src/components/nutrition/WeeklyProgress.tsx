import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp } from 'lucide-react';

interface WeeklyProgressProps {
  data: {
    avgDailyCalories: number;
    mealsLogged: string;
    waterIntake: string;
    exerciseDays: string;
  };
  onViewReport: () => void;
}

export function WeeklyProgress({ data, onViewReport }: WeeklyProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Avg. Daily Calories</span>
            <span className="font-semibold">{data.avgDailyCalories}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Meals Logged</span>
            <span className="font-semibold">{data.mealsLogged}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Water Intake</span>
            <span className="font-semibold">{data.waterIntake}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Exercise Days</span>
            <span className="font-semibold">{data.exerciseDays}</span>
          </div>
        </div>
        <Button className="w-full bg-[#6ec257] hover:bg-[#6ec257]/90 text-white" onClick={onViewReport}>
          View Detailed Report
        </Button>
      </CardContent>
    </Card>
  );
}
