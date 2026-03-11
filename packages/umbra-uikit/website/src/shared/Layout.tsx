import React from 'react';
import { useThemeColors, ScrollArea } from '@wisp-ui/react';
import { NavSidebar } from './NavSidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
  onSearchOpen?: () => void;
}

const SIDEBAR_WIDTH = 240;

/**
 * Shell layout: fixed sidebar on left, top bar + scrollable content on right.
 */
export function Layout({ children, onSearchOpen }: LayoutProps) {
  const colors = useThemeColors();

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: colors.background.canvas,
        overflow: 'hidden',
      }}
    >
      {/* Fixed sidebar */}
      <div
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          borderRight: `1px solid ${colors.border.subtle}`,
          height: '100%',
        }}
      >
        <NavSidebar />
      </div>

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopBar onSearchOpen={onSearchOpen} />

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 40px 64px' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
