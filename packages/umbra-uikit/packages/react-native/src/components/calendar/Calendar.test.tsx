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

import { Calendar } from './Calendar';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Calendar — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Calendar />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('shows month name for a given date', () => {
    const testDate = new Date(2025, 5, 15); // June 2025
    render(
      <Wrapper>
        <Calendar value={testDate} />
      </Wrapper>,
    );
    expect(screen.getByText('June 2025')).toBeInTheDocument();
  });

  it('shows month name for a different date', () => {
    const testDate = new Date(2025, 0, 1); // January 2025
    render(
      <Wrapper>
        <Calendar value={testDate} />
      </Wrapper>,
    );
    expect(screen.getByText('January 2025')).toBeInTheDocument();
  });
});
