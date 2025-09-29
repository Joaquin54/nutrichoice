import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar } from 'lucide-react';

interface DailyOverviewProps {
  data: {
    calories: { current: number; target: number };
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fat: { current: number; target: number };
  };
}

export function DailyOverview({ data }: DailyOverviewProps) {
  const getPercentage = (current: number, target: number) => 
    Math.min((current / target) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Calories</span>
            <span className="font-semibold">{data.calories.current} / {data.calories.target}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${getPercentage(data.calories.current, data.calories.target)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Protein</span>
            <span className="font-semibold">{data.protein.current}g / {data.protein.target}g</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${getPercentage(data.protein.current, data.protein.target)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Carbs</span>
            <span className="font-semibold">{data.carbs.current}g / {data.carbs.target}g</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${getPercentage(data.carbs.current, data.carbs.target)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Fat</span>
            <span className="font-semibold">{data.fat.current}g / {data.fat.target}g</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full" 
              style={{ width: `${getPercentage(data.fat.current, data.fat.target)}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
