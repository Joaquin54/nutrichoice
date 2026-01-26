import { memo } from 'react';
import { Link } from 'react-router-dom';

export const Header = memo(function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 pt-0 pb-0.5">
        <div className="flex items-center justify-center">
          <Link 
            to="/home" 
            className="bg-gradient-to-br from-[#6ec257]/70 to-[#6ec257]/40 dark:from-[#6ec257]/50 dark:to-[#6ec257]/30 px-4 sm:px-6 py-0.5 sm:py-1 rounded-t-xl shadow-md border border-[#6ec257]/30 dark:border-[#6ec257]/20 border-b-0 -mb-[1px]"
          >
            <h1 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
              NutriChoice
            </h1>
          </Link>
        </div>
      </div>
    </header>
  );
});
