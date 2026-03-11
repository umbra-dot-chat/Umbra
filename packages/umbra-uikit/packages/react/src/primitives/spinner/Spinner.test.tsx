/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './Spinner';
import { spinnerSizeMap } from '@coexist/wisp-core/types/Spinner.types';
import { WispProvider } from '../../providers';
import { createTheme } from '@coexist/wisp-core/theme/create-theme';

const darkTheme = createTheme({ mode: 'dark' });
const lightTheme = createTheme({ mode: 'light' });

// ---------------------------------------------------------------------------
// Wrapper
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

describe('Spinner — rendering', () => {
  it('renders an SVG with two circle elements', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const circles = svg!.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });

  it('renders as a div element', () => {
    render(<Dark><Spinner /></Dark>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<Dark><Spinner /></Dark>);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('role', 'status');
  });

  it('has default aria-label="Loading" when no label provided', () => {
    render(<Dark><Spinner /></Dark>);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('uses label text as aria-label when label is provided', () => {
    render(<Dark><Spinner label="Please wait" /></Dark>);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Please wait');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Spinner — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" with correct SVG dimensions`, () => {
      const { container } = render(<Dark><Spinner size={size} /></Dark>);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      const expected = spinnerSizeMap[size].size;
      expect(svg!.style.width).toBe(`${expected}px`);
      expect(svg!.style.height).toBe(`${expected}px`);
    });
  });

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(<Dark><Spinner size={size} /></Dark>);
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('Spinner — label', () => {
  it('renders label text when provided', () => {
    render(<Dark><Spinner label="Loading..." /></Dark>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render a label span when no label is provided', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Custom colors
// ---------------------------------------------------------------------------

describe('Spinner — custom colors', () => {
  it('applies custom indicator color', () => {
    const { container } = render(<Dark><Spinner color="#3B82F6" /></Dark>);
    const circles = container.querySelectorAll('circle');
    // Second circle is the indicator
    expect(circles[1]).toHaveAttribute('stroke', '#3B82F6');
  });

  it('applies custom track color', () => {
    const { container } = render(<Dark><Spinner trackColor="#FF0000" /></Dark>);
    const circles = container.querySelectorAll('circle');
    // First circle is the track
    expect(circles[0]).toHaveAttribute('stroke', '#FF0000');
  });

  it('applies both custom colors simultaneously', () => {
    const { container } = render(
      <Dark><Spinner color="#00FF00" trackColor="#FF0000" /></Dark>,
    );
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('stroke', '#FF0000');
    expect(circles[1]).toHaveAttribute('stroke', '#00FF00');
  });
});

// ---------------------------------------------------------------------------
// Theme-aware default colors
// ---------------------------------------------------------------------------

describe('Spinner — theme colors', () => {
  it('uses border.subtle as track color in dark mode', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('stroke', darkTheme.colors.border.subtle);
  });

  it('uses accent.primary as indicator color in dark mode', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const circles = container.querySelectorAll('circle');
    expect(circles[1]).toHaveAttribute('stroke', darkTheme.colors.accent.primary);
  });

  it('uses border.subtle as track color in light mode', () => {
    const { container } = render(<Light><Spinner /></Light>);
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('stroke', lightTheme.colors.border.subtle);
  });

  it('uses accent.primary as indicator color in light mode', () => {
    const { container } = render(<Light><Spinner /></Light>);
    const circles = container.querySelectorAll('circle');
    expect(circles[1]).toHaveAttribute('stroke', lightTheme.colors.accent.primary);
  });
});

// ---------------------------------------------------------------------------
// SVG structure
// ---------------------------------------------------------------------------

describe('Spinner — SVG structure', () => {
  it('track circle has fill="none"', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('fill', 'none');
  });

  it('indicator circle has fill="none"', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const circles = container.querySelectorAll('circle');
    expect(circles[1]).toHaveAttribute('fill', 'none');
  });

  it('indicator circle has strokeLinecap="round"', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const circles = container.querySelectorAll('circle');
    expect(circles[1]).toHaveAttribute('stroke-linecap', 'round');
  });

  it('indicator circle has strokeDasharray set', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const circles = container.querySelectorAll('circle');
    const dashArray = circles[1].getAttribute('stroke-dasharray');
    expect(dashArray).toBeTruthy();
    expect(Number(dashArray)).toBeGreaterThan(0);
  });

  it('indicator circle has strokeDashoffset set', () => {
    const { container } = render(<Dark><Spinner /></Dark>);
    const circles = container.querySelectorAll('circle');
    const dashOffset = circles[1].getAttribute('stroke-dashoffset');
    expect(dashOffset).toBeTruthy();
    expect(Number(dashOffset)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Props passthrough
// ---------------------------------------------------------------------------

describe('Spinner — props', () => {
  it('passes className through', () => {
    render(<Dark><Spinner className="custom-spinner" /></Dark>);
    expect(screen.getByRole('status')).toHaveClass('custom-spinner');
  });

  it('spreads additional div attributes', () => {
    render(<Dark><Spinner data-testid="my-spinner" /></Dark>);
    expect(screen.getByTestId('my-spinner')).toBeInTheDocument();
  });

  it('merges user style with computed style', () => {
    render(<Dark><Spinner style={{ marginTop: 20 }} /></Dark>);
    expect(screen.getByRole('status').style.marginTop).toBe('20px');
  });
});
