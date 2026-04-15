import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Shield, CheckCircle2 } from 'lucide-react';

interface SecuritySettingsProps {
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const SecuritySettings = memo(function SecuritySettings({
  onSubmit,
  isLoading = false,
  error = null,
}: SecuritySettingsProps) {
  const [success, setSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmNewPassword = formData.get('confirmNewPassword') as string;

    setSuccess(false);
    await onSubmit({ currentPassword, newPassword, confirmNewPassword });
    setSuccess(true);
    // Reset the form inputs by remounting
    setFormKey((k) => k + 1);
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
        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Password changed successfully.
            </div>
          )}

          <Button
            type="submit"
            className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Change Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});
