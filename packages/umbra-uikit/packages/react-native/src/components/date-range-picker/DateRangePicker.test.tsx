/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

import { DateRangePicker } from './DateRangePicker';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('DateRangePicker — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <DateRangePicker />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('shows the default placeholder', () => {
    render(
      <Wrapper>
        <DateRangePicker />
      </Wrapper>,
    );
    expect(screen.getByText('Select dates')).toBeInTheDocument();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <DateRangePicker label="Trip dates" />
      </Wrapper>,
    );
    expect(screen.getByText('Trip dates')).toBeInTheDocument();
  });
});
