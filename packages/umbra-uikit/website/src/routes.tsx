import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { DocsPage } from './pages/DocsPage';
import { PrimitivesPage } from './pages/PrimitivesPage';
import { LayoutsPage } from './pages/LayoutsPage';
import { ComponentsPage } from './pages/ComponentsPage';
import { TokensPage } from './pages/TokensPage';
import { ComponentDetail } from './pages/ComponentDetail';

interface AppRoutesProps {
  onSearchOpen?: () => void;
}

export function AppRoutes({ onSearchOpen }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Landing onSearchOpen={onSearchOpen} />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/tokens" element={<TokensPage />} />
      <Route path="/tokens/:slug" element={<ComponentDetail category="tokens" />} />
      <Route path="/primitives" element={<PrimitivesPage />} />
      <Route path="/primitives/:slug" element={<ComponentDetail category="primitives" />} />
      <Route path="/layouts" element={<LayoutsPage />} />
      <Route path="/layouts/:slug" element={<ComponentDetail category="layouts" />} />
      <Route path="/components" element={<ComponentsPage />} />
      <Route path="/components/:slug" element={<ComponentDetail category="components" />} />
    </Routes>
  );
}
