import { BarChart3, Target, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function NutritionPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nutrition Tracking</h1>
        <p className="text-gray-600">
          Monitor your nutritional intake and health goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Overview */}
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
                <span className="font-semibold">1,250 / 2,000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '62.5%' }}></div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Protein</span>
                <span className="font-semibold">85g / 120g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70.8%' }}></div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Carbs</span>
                <span className="font-semibold">150g / 250g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fat</span>
                <span className="font-semibold">45g / 65g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '69.2%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Weight Loss</span>
                  <span className="text-xs text-green-600">On Track</span>
                </div>
                <p className="text-xs text-green-600 mt-1">-2.5 lbs this month</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">Muscle Gain</span>
                  <span className="text-xs text-blue-600">In Progress</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">+0.8 lbs this month</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-800">Energy Levels</span>
                  <span className="text-xs text-purple-600">Good</span>
                </div>
                <p className="text-xs text-purple-600 mt-1">Consistent energy</p>
              </div>
            </div>
            <Button className="w-full">Update Goals</Button>
          </CardContent>
        </Card>

        {/* Weekly Progress */}
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
                <span className="font-semibold">1,850</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Meals Logged</span>
                <span className="font-semibold">18/21</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Water Intake</span>
                <span className="font-semibold">6.2L avg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Exercise Days</span>
                <span className="font-semibold">4/7</span>
              </div>
            </div>
            <Button className="w-full">View Detailed Report</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Meals */}
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
            <Button>Log Your First Meal</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
