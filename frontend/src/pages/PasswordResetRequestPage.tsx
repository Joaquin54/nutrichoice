import { useState } from 'react';
import { PasswordResetRequestForm } from '../components/auth';
import { requestPasswordReset } from '../api';

export function PasswordResetRequestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async (email: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset link. Please try again.';
      setError(errorMessage);
      console.error('Password reset request error:', err);
    } finally {
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
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-400">
              Password reset email sent! Check your inbox for the reset link.
            </p>
          </div>
        )}
        <PasswordResetRequestForm onSubmit={handleResetRequest} isLoading={isLoading} />
      </div>
    </div>
  );
}
