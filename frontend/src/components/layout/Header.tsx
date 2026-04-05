import { memo } from 'react';
import { Link } from 'react-router-dom';

export const Header = memo(function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#6ec257]/30 bg-gradient-to-br from-[#6ec257]/70 to-[#6ec257]/40 shadow-sm dark:border-[#6ec257]/20 dark:from-[#6ec257]/50 dark:to-[#6ec257]/30">
      <div className="mx-auto flex w-full max-w-full items-center justify-center px-4 py-[9px] sm:max-w-page-sm sm:py-[9px] md:max-w-page-md xl:max-w-7xl 2xl:max-w-screen-2xl">
        <Link
          to="/home"
          className="text-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#6ec257]/50 rounded-sm"
        >
          <h1 className="text-sm font-bold text-gray-900 sm:text-lg dark:text-white">
            NutriChoice
          </h1>
        </Link>
      </div>
    </header>
  );
});
