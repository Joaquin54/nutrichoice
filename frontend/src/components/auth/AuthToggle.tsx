interface AuthToggleProps {
  isLogin: boolean;
  onToggle: () => void;
}

export function AuthToggle({ isLogin, onToggle }: AuthToggleProps) {
  return (
    <div className="text-center">
      <button
        onClick={onToggle}
        className="text-sm text-[#6ec257] hover:text-[#6ec257]/80 font-medium"
      >
        {isLogin 
          ? "Don't have an account? Sign up" 
          : "Already have an account? Sign in"
        }
      </button>
    </div>
  );
}
