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

import { DatePicker } from './DatePicker';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('DatePicker — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <DatePicker />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('shows the default placeholder', () => {
    render(
      <Wrapper>
        <DatePicker />
      </Wrapper>,
    );
    expect(screen.getByText('Select date')).toBeInTheDocument();
  });

  it('shows a custom placeholder', () => {
    render(
      <Wrapper>
        <DatePicker placeholder="Pick a date" />
      </Wrapper>,
    );
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <DatePicker label="Start date" />
      </Wrapper>,
    );
    expect(screen.getByText('Start date')).toBeInTheDocument();
  });
});
