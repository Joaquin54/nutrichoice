import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

export function Layout() {
  const location = useLocation();
  const isCookbookView = /^\/cookbooks\/[^/]+$/.test(location.pathname);

  return (
    <div className="min-h-screen bg-[#6ec257]/15 dark:bg-gray-900">
      <Header />
      <Navigation />
      <main
        className="container mx-auto px-3 sm:px-4 pt-2 pb-4 sm:py-6 md:py-8"
        style={isCookbookView ? { paddingTop: '5px' } : undefined}
      >
        <Outlet />
      </main>
    </div>
  );
}
