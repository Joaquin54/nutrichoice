import { useState, useCallback } from 'react';
import { 
  ProfileForm, 
  DietaryPreferencesCard, 
  NotificationSettings, 
  SecuritySettings 
} from '../components/account';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Button } from '../components/ui/button';
import { Edit2, Save, X } from 'lucide-react';
import type { DietaryFilter } from '../types/recipe';

export function AccountPage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [dietaryLoading, setDietaryLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  
  // Get dietary preferences from shared context
  const { dietaryPreferences, updateDietaryPreferences } = useUserPreferences();
  
  // Mock data - in real app, this would come from API/context
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Food enthusiast and home cook'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    recipeRecommendations: true,
    weeklyMealPlans: false,
  });

  // Store temporary values while editing
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [tempDietaryPreferences, setTempDietaryPreferences] = useState(dietaryPreferences);
  const [tempNotificationSettings, setTempNotificationSettings] = useState(notificationSettings);

  const handleEditClick = () => {
    // Store current values as temporary values
    setTempProfileData(profileData);
    setTempDietaryPreferences(dietaryPreferences);
    setTempNotificationSettings(notificationSettings);
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    // Revert to original values
    setTempProfileData(profileData);
    setTempDietaryPreferences(dietaryPreferences);
    setTempNotificationSettings(notificationSettings);
    setIsEditMode(false);
  };

  const handleSaveAll = useCallback(async () => {
    setProfileLoading(true);
    setDietaryLoading(true);
    setNotificationLoading(true);
    
    // Save all changes
    try {
      // Save profile
      await handleProfileSubmit(tempProfileData);
      
      // Save dietary preferences
      await handleDietaryPreferencesChange(tempDietaryPreferences);
      
      // Save notification settings
      await handleNotificationSettingsChange(tempNotificationSettings);
      
      // Update the actual state
      setProfileData(tempProfileData);
      
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setProfileLoading(false);
      setDietaryLoading(false);
      setNotificationLoading(false);
    }
  }, [tempProfileData, tempDietaryPreferences, tempNotificationSettings]);

  const handleProfileSubmit = useCallback(async (data: { name: string; email: string; bio: string }) => {
    // TODO: Implement profile update logic
    console.log('Profile update:', data);
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  }, []);

  const handleDietaryPreferencesChange = useCallback(async (preferences: DietaryFilter) => {
    // TODO: Implement dietary preferences update logic
    console.log('Dietary preferences update:', preferences);
    updateDietaryPreferences(preferences);
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  }, [updateDietaryPreferences]);

  const handleNotificationSettingsChange = useCallback(async (settings: typeof notificationSettings) => {
    // TODO: Implement notification settings update logic
    console.log('Notification settings update:', settings);
    setNotificationSettings(settings);
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  }, []);

  const handleSecuritySubmit = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    setSecurityLoading(true);
    // TODO: Implement password change logic
    console.log('Password change:', data);
    setTimeout(() => setSecurityLoading(false), 1000);
  }, []);

  const isSaving = profileLoading || dietaryLoading || notificationLoading;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your profile and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <Button 
              onClick={handleEditClick}
              className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleCancelClick}
                variant="outline"
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAll}
                className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save All'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ProfileForm 
          onSubmit={handleProfileSubmit} 
          isLoading={profileLoading}
          initialData={isEditMode ? tempProfileData : profileData}
          isReadOnly={!isEditMode}
          onDataChange={setTempProfileData}
        />
        
        <DietaryPreferencesCard 
          preferences={isEditMode ? tempDietaryPreferences : dietaryPreferences}
          onPreferencesChange={(prefs) => setTempDietaryPreferences(prefs)}
          isLoading={dietaryLoading}
          isReadOnly={!isEditMode}
        />
        
        <NotificationSettings 
          settings={isEditMode ? tempNotificationSettings : notificationSettings}
          onSettingsChange={(settings) => setTempNotificationSettings(settings)}
          isLoading={notificationLoading}
          isReadOnly={!isEditMode}
        />
        
        <SecuritySettings 
          onSubmit={handleSecuritySubmit}
          isLoading={securityLoading}
          isReadOnly={!isEditMode}
        />
      </div>
    </div>
  );
}
