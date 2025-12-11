import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Lock, CheckCircle2 } from 'lucide-react';

interface PasswordChangeFormProps {
  onSubmit: (currentPassword: string, newPassword: string, confirmPassword: string) => void;
  isLoading?: boolean;
}

export function PasswordChangeForm({ onSubmit, isLoading = false }: PasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const current = formData.get('currentPassword') as string;
    const newPwd = formData.get('newPassword') as string;
    const confirm = formData.get('confirmPassword') as string;
    
    if (newPwd !== confirm) {
      return;
    }
    
    onSubmit(current, newPwd, confirm);
    setShowSuccess(true);
    
    // Reset form after successful submission
    setTimeout(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowSuccess(false);
    }, 3000);
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;

  if (showSuccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">Password changed successfully!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="Enter current password"
                className="pl-10 focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                className="pl-10 focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {passwordTooShort && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="pl-10 focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Passwords do not match
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#6ec257] hover:bg-[#6ec257]/90 text-white" 
            disabled={isLoading || !passwordsMatch || passwordTooShort}
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


