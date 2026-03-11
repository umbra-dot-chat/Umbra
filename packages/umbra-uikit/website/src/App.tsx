import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from './shared/Layout';
import { SearchPalette } from './shared/SearchPalette';
import { AppRoutes } from './routes';

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Landing page renders without the sidebar layout
  if (isLanding) {
    return (
      <>
        <AppRoutes onSearchOpen={() => setSearchOpen(true)} />
        <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </>
    );
  }

  return (
    <Layout onSearchOpen={() => setSearchOpen(true)}>
      <AppRoutes />
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </Layout>
  );
}
