import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordChangeForm } from '../components/auth';
import { changePassword } from '../api';

export function PasswordChangePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePasswordChange = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      // Password changed successfully, redirect after a short delay
      setTimeout(() => {
        navigate('/account');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password. Please try again.';
      setError(errorMessage);
      console.error('Password change error:', err);
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
        <PasswordChangeForm onSubmit={handlePasswordChange} isLoading={isLoading} />
      </div>
    </div>
  );
}


