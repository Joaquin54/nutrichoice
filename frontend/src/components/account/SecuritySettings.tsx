import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Shield } from 'lucide-react';

interface SecuritySettingsProps {
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export const SecuritySettings = memo(function SecuritySettings({ onSubmit, isLoading = false, isReadOnly = false }: SecuritySettingsProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmNewPassword = formData.get('confirmNewPassword') as string;
    onSubmit({ currentPassword, newPassword, confirmNewPassword });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Security
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input 
              id="currentPassword" 
              name="currentPassword"
              type="password" 
              disabled={isReadOnly}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50 dark:bg-gray-800 cursor-default' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword" 
              name="newPassword"
              type="password" 
              disabled={isReadOnly}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50 dark:bg-gray-800 cursor-default' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input 
              id="confirmNewPassword" 
              name="confirmNewPassword"
              type="password" 
              disabled={isReadOnly}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50 dark:bg-gray-800 cursor-default' : ''}
            />
          </div>
          {isReadOnly && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click "Edit" above to change your password
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
});
