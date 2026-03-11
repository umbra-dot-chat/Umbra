/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spacer } from './Spacer';
import type { SpacerSize } from './Spacer';

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Spacer — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spacer />);
    expect(container).toBeTruthy();
  });

  it('renders without crashing when no props are provided', () => {
    const { container } = render(<Spacer />);
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

describe('Spacer — size', () => {
  const sizes: SpacerSize[] = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

  const expectedPixels: Record<SpacerSize, number> = {
    '2xs': 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  };

  sizes.forEach((size) => {
    it(`applies width and height for size="${size}"`, () => {
      const { container } = render(<Spacer size={size} />);
      const el = container.firstChild as HTMLElement;
      expect(el).toBeTruthy();
      expect(el.style.width).toBe(`${expectedPixels[size]}px`);
      expect(el.style.height).toBe(`${expectedPixels[size]}px`);
    });
  });
});

// ---------------------------------------------------------------------------
// Flex
// ---------------------------------------------------------------------------

describe('Spacer — flex', () => {
  it('applies flex: 1 when flex is true', () => {
    const { container } = render(<Spacer flex />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.flexGrow).toBeTruthy();
  });

  it('applies a custom flex value when flex is a number', () => {
    const { container } = render(<Spacer flex={2} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.flexGrow).toBeTruthy();
  });
});
