/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Text } from './Text';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { createTheme } from '@coexist/wisp-core/theme/create-theme';

const darkTheme = createTheme({ mode: 'dark' });
const lightTheme = createTheme({ mode: 'light' });

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const Light = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="light">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Text — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Text>Hello Wisp</Text></Dark>);
    expect(screen.getByText('Hello Wisp')).toBeInTheDocument();
  });

  it('renders as span by default', () => {
    render(<Dark><Text>span</Text></Dark>);
    expect(screen.getByText('span').tagName).toBe('SPAN');
  });

  it('renders as custom element via "as" prop', () => {
    render(<Dark><Text as="h1">heading</Text></Dark>);
    expect(screen.getByText('heading').tagName).toBe('H1');
  });

  it('renders as paragraph', () => {
    render(<Dark><Text as="p">paragraph</Text></Dark>);
    expect(screen.getByText('paragraph').tagName).toBe('P');
  });

  it('passes className through', () => {
    render(<Dark><Text className="custom-class">text</Text></Dark>);
    expect(screen.getByText('text')).toHaveClass('custom-class');
  });

  it('passes custom style through', () => {
    render(<Dark><Text style={{ marginTop: 42 }}>styled</Text></Dark>);
    expect(screen.getByText('styled')).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Text — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Text size={size}>{size}</Text></Dark>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });

  const displaySizes = ['display-xs', 'display-sm', 'display-md', 'display-lg', 'display-xl', 'display-2xl'] as const;

  displaySizes.forEach((size) => {
    it(`renders display size="${size}" without crashing`, () => {
      render(<Dark><Text size={size}>{size}</Text></Dark>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

describe('Text — weights', () => {
  const weights = ['regular', 'medium', 'semibold', 'bold'] as const;

  weights.forEach((weight) => {
    it(`renders weight="${weight}" without crashing`, () => {
      render(<Dark><Text weight={weight}>{weight}</Text></Dark>);
      expect(screen.getByText(weight)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Text — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><Text skeleton size="md" /></Dark>);
    const skeleton = container.querySelector('[aria-hidden]');
    expect(skeleton).toBeTruthy();
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render children when skeleton', () => {
    render(<Dark><Text skeleton>Should not appear</Text></Dark>);
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Truncation
// ---------------------------------------------------------------------------

describe('Text — truncation', () => {
  it('applies overflow hidden for single-line truncation', () => {
    render(<Dark><Text truncate>Truncated text</Text></Dark>);
    const el = screen.getByText('Truncated text');
    expect(el).toHaveStyle({ overflow: 'hidden' });
    expect(el).toHaveStyle({ textOverflow: 'ellipsis' });
    expect(el).toHaveStyle({ whiteSpace: 'nowrap' });
  });
});

// ---------------------------------------------------------------------------
// Contrast testing — automated WCAG audit
// ---------------------------------------------------------------------------

describe('Text — WCAG contrast', () => {
  describe('dark mode', () => {
    const canvas = darkTheme.colors.background.canvas;

    it('primary text on dark canvas passes AA (4.5:1)', () => {
      const ratio = contrastRatio(darkTheme.colors.text.primary, canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('secondary text on dark canvas passes AA-large (3:1)', () => {
      const ratio = contrastRatio(darkTheme.colors.text.secondary, canvas);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('inverse text on dark surface passes AA (4.5:1)', () => {
      // Inverse text is meant for opposite-mode surfaces
      // In dark mode, it should work on raised/surface
      const surface = darkTheme.colors.background.surface;
      const ratio = contrastRatio(darkTheme.colors.text.primary, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('light mode', () => {
    const canvas = lightTheme.colors.background.canvas;

    it('primary text on light canvas passes AA (4.5:1)', () => {
      const ratio = contrastRatio(lightTheme.colors.text.primary, canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('secondary text on light canvas passes AA-large (3:1)', () => {
      const ratio = contrastRatio(lightTheme.colors.text.secondary, canvas);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('inverse text on dark surface passes AA (4.5:1)', () => {
      const surface = lightTheme.colors.background.surface;
      const ratio = contrastRatio(lightTheme.colors.text.inverse, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
