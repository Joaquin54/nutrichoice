interface AuthToggleProps {
  isLogin: boolean;
  onToggle: () => void;
}

export function AuthToggle({ isLogin, onToggle }: AuthToggleProps) {
  return (
    <div className="text-center">
      <button
        onClick={onToggle}
        className="text-sm text-green-600 hover:text-green-700 font-medium"
      >
        {isLogin 
          ? "Don't have an account? Sign up" 
          : "Already have an account? Sign in"
        }
      </button>
    </div>
  );
}
