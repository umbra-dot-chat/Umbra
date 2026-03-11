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

import { Carousel } from './Carousel';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Carousel — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Carousel>
          <div>Slide 1</div>
        </Carousel>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders children slides', () => {
    render(
      <Wrapper>
        <Carousel>
          <div>First Slide</div>
          <div>Second Slide</div>
          <div>Third Slide</div>
        </Carousel>
      </Wrapper>,
    );
    expect(screen.getByText('First Slide')).toBeInTheDocument();
    expect(screen.getByText('Second Slide')).toBeInTheDocument();
    expect(screen.getByText('Third Slide')).toBeInTheDocument();
  });
});
