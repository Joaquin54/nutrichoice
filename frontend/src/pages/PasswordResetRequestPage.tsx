import { useState } from 'react';
import { PasswordResetRequestForm } from '../components/auth';

export function PasswordResetRequestPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleResetRequest = async (email: string) => {
    setIsLoading(true);
    // TODO: Implement password reset request logic
    console.log('Password reset requested for:', email);
    setTimeout(() => {
      setIsLoading(false);
      // You might want to show a success message here
      alert('If an account exists with this email, you will receive a password reset link.');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#6ec257]/15 dark:bg-gray-900 flex items-center justify-center px-4">
      <PasswordResetRequestForm onSubmit={handleResetRequest} isLoading={isLoading} />
    </div>
  );
}

