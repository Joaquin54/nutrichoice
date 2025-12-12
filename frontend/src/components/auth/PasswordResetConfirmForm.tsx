import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PasswordResetConfirmFormProps {
  onSubmit: (password: string, confirmPassword: string, token: string) => void;
  isLoading?: boolean;
  token?: string;
}

export function PasswordResetConfirmForm({ onSubmit, isLoading = false, token = '' }: PasswordResetConfirmFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('password') as string;
    const newConfirmPassword = formData.get('confirmPassword') as string;
    const resetToken = formData.get('token') as string || token;
    
    if (newPassword !== newConfirmPassword) {
      // You might want to add error handling here
      return;
    }
    
    onSubmit(newPassword, newConfirmPassword, resetToken);
    setShowSuccess(true);
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;

  if (showSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Password Reset Successful
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>
            <Button asChild className="w-full bg-[#6ec257] hover:bg-[#6ec257]/90 text-white">
              <Link to="/">Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <div className="space-y-2">
              <Label htmlFor="token">Reset Token</Label>
              <Input
                id="token"
                name="token"
                type="text"
                placeholder="Enter reset token"
                className="focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                className="pl-10 focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


