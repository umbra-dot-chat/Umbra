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

import { LocalePicker, DEFAULT_LOCALE_OPTIONS } from './LocalePicker';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('LocalePicker — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <LocalePicker />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('shows placeholder when no value is selected', () => {
    render(
      <Wrapper>
        <LocalePicker placeholder="Choose language" />
      </Wrapper>,
    );
    expect(screen.getByText('Choose language')).toBeInTheDocument();
  });

  it('shows the default placeholder when none is provided', () => {
    render(
      <Wrapper>
        <LocalePicker />
      </Wrapper>,
    );
    expect(screen.getByText('Select language')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Current locale display
// ---------------------------------------------------------------------------

describe('LocalePicker — current locale', () => {
  it('shows current locale label when value is provided', () => {
    render(
      <Wrapper>
        <LocalePicker value="es-ES" />
      </Wrapper>,
    );
    expect(screen.getByText('Spanish (Spain)')).toBeInTheDocument();
  });

  it('shows current locale label when defaultValue is provided', () => {
    render(
      <Wrapper>
        <LocalePicker defaultValue="ja-JP" />
      </Wrapper>,
    );
    expect(screen.getByText('Japanese (Japan)')).toBeInTheDocument();
  });

  it('shows correct label for custom options', () => {
    const customOptions = [
      { code: 'en', label: 'English', region: 'Global' },
      { code: 'fr', label: 'French', region: 'Global' },
    ];
    render(
      <Wrapper>
        <LocalePicker options={customOptions} value="fr" />
      </Wrapper>,
    );
    expect(screen.getByText('French')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('LocalePicker — label', () => {
  it('renders label text', () => {
    render(
      <Wrapper>
        <LocalePicker label="Language" />
      </Wrapper>,
    );
    expect(screen.getByText('Language')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('LocalePicker — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper>
          <LocalePicker size={size} />
        </Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('LocalePicker — disabled', () => {
  it('renders with disabled state without crashing', () => {
    const { container } = render(
      <Wrapper>
        <LocalePicker disabled />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('Select language')).toBeInTheDocument();
  });
});
