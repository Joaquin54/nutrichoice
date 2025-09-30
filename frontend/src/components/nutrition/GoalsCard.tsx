import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Target } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  status: 'on-track' | 'in-progress' | 'needs-attention';
  progress: string;
  color: 'green' | 'blue' | 'purple';
}

interface GoalsCardProps {
  goals: Goal[];
  onUpdateGoals: () => void;
  isLoading?: boolean;
}

export function GoalsCard({ goals, onUpdateGoals, isLoading = false }: GoalsCardProps) {
  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'on-track': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'needs-attention': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getBgColor = (color: Goal['color']) => {
    switch (color) {
      case 'green': return 'bg-green-50';
      case 'blue': return 'bg-blue-50';
      case 'purple': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };

  const getTextColor = (color: Goal['color']) => {
    switch (color) {
      case 'green': return 'text-green-800';
      case 'blue': return 'text-blue-800';
      case 'purple': return 'text-purple-800';
      default: return 'text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Your Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.id} className={`p-3 ${getBgColor(goal.color)} rounded-lg`}>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${getTextColor(goal.color)}`}>
                  {goal.name}
                </span>
                <span className={`text-xs ${getStatusColor(goal.status)}`}>
                  {goal.status === 'on-track' ? 'On Track' : 
                   goal.status === 'in-progress' ? 'In Progress' : 'Needs Attention'}
                </span>
              </div>
              <p className={`text-xs ${getTextColor(goal.color)} mt-1`}>
                {goal.progress}
              </p>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={onUpdateGoals} disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Goals'}
        </Button>
      </CardContent>
    </Card>
  );
}
