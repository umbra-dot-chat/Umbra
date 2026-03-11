/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ColorSwatch } from './ColorSwatch';
import { colorSwatchSizes, colorSwatchShapes } from '@coexist/wisp-core/types/ColorSwatch.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ColorSwatch — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dark><ColorSwatch color="#3B82F6" /></Dark>);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('applies the color as a background style', () => {
    const { container } = render(
      <Dark><ColorSwatch color="#10B981" data-testid="swatch" /></Dark>,
    );
    const swatch = screen.getByTestId('swatch');
    expect(swatch.style.backgroundColor).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('ColorSwatch — sizes', () => {
  colorSwatchSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Dark><ColorSwatch color="#3B82F6" size={size} data-testid={`swatch-${size}`} /></Dark>,
      );
      expect(screen.getByTestId(`swatch-${size}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

describe('ColorSwatch — shapes', () => {
  colorSwatchShapes.forEach((shape) => {
    it(`renders shape="${shape}" without crashing`, () => {
      render(
        <Dark><ColorSwatch color="#3B82F6" shape={shape} data-testid={`swatch-${shape}`} /></Dark>,
      );
      expect(screen.getByTestId(`swatch-${shape}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Bordered
// ---------------------------------------------------------------------------

describe('ColorSwatch — bordered', () => {
  it('is bordered by default', () => {
    render(<Dark><ColorSwatch color="#3B82F6" data-testid="bordered" /></Dark>);
    const swatch = screen.getByTestId('bordered');
    // bordered=true by default adds a border style
    expect(swatch.style.border).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Checkerboard
// ---------------------------------------------------------------------------

describe('ColorSwatch — checkerboard', () => {
  it('renders an inner div when checkerboard={true}', () => {
    render(
      <Dark>
        <ColorSwatch color="rgba(59, 130, 246, 0.5)" checkerboard data-testid="checker" />
      </Dark>,
    );
    const wrapper = screen.getByTestId('checker');
    const inner = wrapper.querySelector('div');
    expect(inner).toBeTruthy();
  });

  it('does not render an inner div when checkerboard is not set', () => {
    render(
      <Dark><ColorSwatch color="#3B82F6" data-testid="no-checker" /></Dark>,
    );
    const swatch = screen.getByTestId('no-checker');
    const inner = swatch.querySelector('div');
    expect(inner).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('ColorSwatch — className', () => {
  it('passes className through', () => {
    render(
      <Dark><ColorSwatch color="#3B82F6" className="custom" data-testid="classed" /></Dark>,
    );
    expect(screen.getByTestId('classed')).toHaveClass('custom');
  });
});
