import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PasswordResetConfirmForm } from '../components/auth';
import { confirmPasswordReset } from '../api';

export function PasswordResetConfirmPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const user_id = searchParams.get('user_id') || '';

  const handlePasswordReset = async (password: string, confirmPassword: string, resetToken: string) => {
    setIsLoading(true);
    setError(null);
    
    if (!user_id) {
      setError('Invalid reset link. Please request a new password reset.');
      setIsLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(resetToken || token, user_id, password, confirmPassword);
      // Password reset successful - the form will show success message
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password. The link may be invalid or expired.';
      setError(errorMessage);
      console.error('Password reset confirm error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#6ec257]/15 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        <PasswordResetConfirmForm 
          onSubmit={handlePasswordReset} 
          isLoading={isLoading} 
          token={token}
        />
      </div>
    </div>
  );
}


