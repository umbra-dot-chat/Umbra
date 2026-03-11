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
  return { __esModule: true, default: Svg, Svg, Path, Polyline: Path };
});

import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
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

describe('Breadcrumb — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Breadcrumb>
          <BreadcrumbItem>Home</BreadcrumbItem>
        </Breadcrumb>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders breadcrumb items', () => {
    render(
      <Wrapper>
        <Breadcrumb>
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbItem>Products</BreadcrumbItem>
          <BreadcrumbItem active>Current Page</BreadcrumbItem>
        </Breadcrumb>
      </Wrapper>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('renders with a custom separator', () => {
    render(
      <Wrapper>
        <Breadcrumb separator={<span data-testid="custom-sep">/</span>}>
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbItem>Products</BreadcrumbItem>
        </Breadcrumb>
      </Wrapper>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByTestId('custom-sep')).toBeInTheDocument();
  });
});
