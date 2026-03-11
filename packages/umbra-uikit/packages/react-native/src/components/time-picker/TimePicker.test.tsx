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

import { TimePicker } from './TimePicker';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('TimePicker — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <TimePicker />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('shows the default placeholder', () => {
    render(
      <Wrapper>
        <TimePicker />
      </Wrapper>,
    );
    expect(screen.getByText('Select time')).toBeInTheDocument();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <TimePicker label="Meeting time" />
      </Wrapper>,
    );
    expect(screen.getByText('Meeting time')).toBeInTheDocument();
  });
});
