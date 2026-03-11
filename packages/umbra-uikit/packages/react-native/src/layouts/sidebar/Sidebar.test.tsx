/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock react-native-svg to avoid fabric module resolution errors in tests
vi.mock('react-native-svg', () => {
  const React = require('react');
  const Svg = React.forwardRef((props: any, ref: any) =>
    React.createElement('svg', { ...props, ref }),
  );
  Svg.displayName = 'Svg';
  const Path = React.forwardRef((props: any, ref: any) =>
    React.createElement('path', { ...props, ref }),
  );
  Path.displayName = 'Path';
  const Polyline = React.forwardRef((props: any, ref: any) =>
    React.createElement('polyline', { ...props, ref }),
  );
  Polyline.displayName = 'Polyline';
  return { __esModule: true, default: Svg, Svg, Path, Polyline };
});

import { Sidebar, SidebarSection, SidebarItem } from './Sidebar';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Sidebar — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Home" />
          </SidebarSection>
        </Sidebar>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders children content', () => {
    render(
      <Wrapper>
        <Sidebar>
          <SidebarSection title="Navigation">
            <SidebarItem label="Dashboard" />
            <SidebarItem label="Settings" />
          </SidebarSection>
        </Sidebar>
      </Wrapper>,
    );
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders with the menu accessibility role', () => {
    const { container } = render(
      <Wrapper>
        <Sidebar>
          <SidebarSection>
            <SidebarItem label="Home" />
          </SidebarSection>
        </Sidebar>
      </Wrapper>,
    );
    const menu = container.querySelector('[role="menu"]');
    expect(menu).toBeInTheDocument();
  });
});
