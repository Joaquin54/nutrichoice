import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

export function Layout() {
  const location = useLocation();
  const isCookbookView = /^\/cookbooks\/[^/]+$/.test(location.pathname);

  return (
    <div
      className={
        isCookbookView
          ? 'flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#6ec257]/15 dark:bg-gray-900'
          : 'flex min-h-[100dvh] flex-col bg-[#6ec257]/15 dark:bg-gray-900'
      }
    >
      <Header />
      <Navigation />
      <main
        className={
          isCookbookView
            ? 'mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden px-2 pb-[10px] pt-1 sm:max-w-page-sm md:max-w-page-md sm:px-4 xl:max-w-7xl 2xl:max-w-screen-2xl'
            : 'mx-auto w-full max-w-full px-3 pt-2 pb-4 sm:max-w-page-sm sm:px-4 sm:py-6 md:max-w-page-md md:py-8 xl:max-w-7xl 2xl:max-w-screen-2xl'
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
