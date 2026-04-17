import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export const Header = memo(function Header() {
  return (
    <header className="relative hidden w-full items-center bg-[color-mix(in_srgb,#6ec257_15%,white)] dark:bg-gray-900 md:flex">
      <div className="mx-auto flex w-full max-w-full items-center justify-center px-4 py-2.5 sm:max-w-page-sm sm:py-2.5 md:max-w-page-md xl:max-w-7xl 2xl:max-w-screen-2xl">
        <Link
          to="/home"
          className="flex w-fit max-w-full min-h-[2.5rem] items-center justify-center gap-2 rounded-sm text-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ec257]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[color-mix(in_srgb,#6ec257_15%,white)] dark:focus-visible:ring-[#6ec257]/40 dark:focus-visible:ring-offset-gray-900 sm:min-h-0"
        >
          <Leaf className="h-5 w-5 shrink-0 text-[#6ec257] dark:text-[#6ec257]/80" />
          <h1 className="translate-y-0.5 font-carattere text-[2rem] font-normal leading-none text-gray-900 dark:text-white">
            NutriChoice
          </h1>
        </Link>
      </div>
    </header>
  );
});
