/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ratingSizes } from '@coexist/wisp-core/types/Rating.types';
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

import { Rating } from './Rating';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Rating — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper><Rating /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with accessibility label', () => {
    render(
      <Wrapper><Rating value={3} /></Wrapper>,
    );
    expect(screen.getByLabelText('Rating: 3 out of 5')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Value prop
// ---------------------------------------------------------------------------

describe('Rating — value', () => {
  it('renders with value=0', () => {
    render(
      <Wrapper><Rating value={0} /></Wrapper>,
    );
    expect(screen.getByLabelText('Rating: 0 out of 5')).toBeInTheDocument();
  });

  it('renders with value=5', () => {
    render(
      <Wrapper><Rating value={5} /></Wrapper>,
    );
    expect(screen.getByLabelText('Rating: 5 out of 5')).toBeInTheDocument();
  });

  it('renders with half values when allowHalf is true', () => {
    render(
      <Wrapper><Rating value={3.5} allowHalf /></Wrapper>,
    );
    expect(screen.getByLabelText('Rating: 3.5 out of 5')).toBeInTheDocument();
  });

  it('displays numeric value when showValue is true', () => {
    render(
      <Wrapper><Rating value={4} showValue /></Wrapper>,
    );
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders with custom max', () => {
    render(
      <Wrapper><Rating value={7} max={10} /></Wrapper>,
    );
    expect(screen.getByLabelText('Rating: 7 out of 10')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Read-only
// ---------------------------------------------------------------------------

describe('Rating — readOnly', () => {
  it('renders in readOnly mode without crashing', () => {
    const { container } = render(
      <Wrapper><Rating value={3} readOnly /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders in disabled mode without crashing', () => {
    const { container } = render(
      <Wrapper><Rating value={2} disabled /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Rating — sizes', () => {
  ratingSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Rating value={3} size={size} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});
