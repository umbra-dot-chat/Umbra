/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { circularProgressSizes } from '@coexist/wisp-core/types/CircularProgress.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Mock react-native-svg (Fabric native component cannot resolve in jsdom)
// ---------------------------------------------------------------------------

vi.mock('react-native-svg', () => {
  const React = require('react');
  const createComponent = (name: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
      React.createElement(name.toLowerCase(), { ...props, ref }),
    );
  return {
    __esModule: true,
    default: createComponent('svg'),
    Svg: createComponent('svg'),
    Circle: createComponent('circle'),
    Rect: createComponent('rect'),
    Path: createComponent('path'),
    G: createComponent('g'),
    Defs: createComponent('defs'),
    ClipPath: createComponent('clipPath'),
    Line: createComponent('line'),
    Polygon: createComponent('polygon'),
    Polyline: createComponent('polyline'),
    Text: createComponent('text'),
  };
});

import { CircularProgress } from './CircularProgress';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('CircularProgress — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper><CircularProgress /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('has progressbar accessibility role', () => {
    render(
      <Wrapper><CircularProgress value={50} /></Wrapper>,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with a label', () => {
    render(
      <Wrapper><CircularProgress value={60} label="Uploading" /></Wrapper>,
    );
    expect(screen.getByText('Uploading')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Value prop
// ---------------------------------------------------------------------------

describe('CircularProgress — value', () => {
  it('renders with value=0', () => {
    const { container } = render(
      <Wrapper><CircularProgress value={0} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with value=50', () => {
    const { container } = render(
      <Wrapper><CircularProgress value={50} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with value=100', () => {
    const { container } = render(
      <Wrapper><CircularProgress value={100} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('displays formatted value when showValue is true', () => {
    render(
      <Wrapper><CircularProgress value={75} showValue /></Wrapper>,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders indeterminate mode without crashing', () => {
    const { container } = render(
      <Wrapper><CircularProgress indeterminate /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('CircularProgress — sizes', () => {
  circularProgressSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper><CircularProgress value={50} size={size} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});
