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

import { Combobox } from './Combobox';
import type { SelectOption } from '../select/Select';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const sampleOptions: SelectOption[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Combobox — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Combobox options={sampleOptions} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('shows placeholder text when no value is selected', () => {
    render(
      <Wrapper>
        <Combobox options={sampleOptions} placeholder="Pick a color" />
      </Wrapper>,
    );
    expect(screen.getByText('Pick a color')).toBeInTheDocument();
  });

  it('shows selected option label when value is provided', () => {
    render(
      <Wrapper>
        <Combobox options={sampleOptions} value="green" />
      </Wrapper>,
    );
    expect(screen.getByText('Green')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label and error
// ---------------------------------------------------------------------------

describe('Combobox — label and error', () => {
  it('renders label text', () => {
    render(
      <Wrapper>
        <Combobox options={sampleOptions} label="Color" />
      </Wrapper>,
    );
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(
      <Wrapper>
        <Combobox options={sampleOptions} error="This field is required" />
      </Wrapper>,
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Combobox — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper>
          <Combobox options={sampleOptions} size={size} />
        </Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Combobox — disabled', () => {
  it('renders with disabled state without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Combobox options={sampleOptions} disabled placeholder="Disabled" />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});
