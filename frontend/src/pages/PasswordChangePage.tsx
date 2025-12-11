import { useState } from 'react';
import { PasswordChangeForm } from '../components/auth';

export function PasswordChangePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    setIsLoading(true);
    // TODO: Implement password change logic
    console.log('Password change requested');
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#6ec257]/15 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <PasswordChangeForm onSubmit={handlePasswordChange} isLoading={isLoading} />
      </div>
    </div>
  );
}

