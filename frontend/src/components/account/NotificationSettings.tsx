import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bell } from 'lucide-react';

interface NotificationSettingsData {
  emailNotifications: boolean;
  recipeRecommendations: boolean;
  weeklyMealPlans: boolean;
}

interface NotificationSettingsProps {
  settings: NotificationSettingsData;
  onSettingsChange: (settings: NotificationSettingsData) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export const NotificationSettings = memo(function NotificationSettings({
  settings,
  onSettingsChange,
  isReadOnly = false
}: NotificationSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    if (isReadOnly) return;
    const updated = {
      ...localSettings,
      [key]: value,
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className={`flex items-center space-x-2 ${isReadOnly ? 'cursor-default opacity-75' : 'cursor-pointer'}`}>
            <input 
              type="checkbox" 
              className="rounded" 
              checked={localSettings.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              disabled={isReadOnly}
            />
            <span className="text-sm">Email notifications</span>
          </label>
          <label className={`flex items-center space-x-2 ${isReadOnly ? 'cursor-default opacity-75' : 'cursor-pointer'}`}>
            <input 
              type="checkbox" 
              className="rounded" 
              checked={localSettings.recipeRecommendations}
              onChange={(e) => handleSettingChange('recipeRecommendations', e.target.checked)}
              disabled={isReadOnly}
            />
            <span className="text-sm">Recipe recommendations</span>
          </label>
          <label className={`flex items-center space-x-2 ${isReadOnly ? 'cursor-default opacity-75' : 'cursor-pointer'}`}>
            <input 
              type="checkbox" 
              className="rounded" 
              checked={localSettings.weeklyMealPlans}
              onChange={(e) => handleSettingChange('weeklyMealPlans', e.target.checked)}
              disabled={isReadOnly}
            />
            <span className="text-sm">Weekly meal plans</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
});
