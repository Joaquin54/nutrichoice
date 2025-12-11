import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PasswordResetConfirmForm } from '../components/auth';

export function PasswordResetConfirmPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const handlePasswordReset = async (password: string, confirmPassword: string, resetToken: string) => {
    setIsLoading(true);
    // TODO: Implement password reset confirm logic
    console.log('Password reset confirmed with token:', resetToken);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#6ec257]/15 dark:bg-gray-900 flex items-center justify-center px-4">
      <PasswordResetConfirmForm 
        onSubmit={handlePasswordReset} 
        isLoading={isLoading} 
        token={token}
      />
    </div>
  );
}

