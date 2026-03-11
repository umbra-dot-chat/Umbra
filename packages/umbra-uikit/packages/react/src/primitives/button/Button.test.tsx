/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { buttonVariants } from '@coexist/wisp-core/types/Button.types';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { resolveVariantColors } from '@coexist/wisp-core/styles/Button.styles';
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

describe('Button — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Button>Click me</Button></Dark>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<Dark><Button>btn</Button></Dark>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('defaults to type="button"', () => {
    render(<Dark><Button>btn</Button></Dark>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('passes className through', () => {
    render(<Dark><Button className="custom">btn</Button></Dark>);
    expect(screen.getByRole('button')).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Button — variants', () => {
  buttonVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Dark><Button variant={variant}>{variant}</Button></Dark>);
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Button — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Button size={size}>{size}</Button></Dark>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

describe('Button — shapes', () => {
  const shapes = ['rounded', 'pill', 'square'] as const;

  shapes.forEach((shape) => {
    it(`renders shape="${shape}" without crashing`, () => {
      render(<Dark><Button shape={shape}>{shape}</Button></Dark>);
      expect(screen.getByText(shape)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Button — disabled', () => {
  it('sets disabled attribute', () => {
    render(<Dark><Button disabled>disabled</Button></Dark>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('prevents click handler when disabled', () => {
    const onClick = vi.fn();
    render(<Dark><Button disabled onClick={onClick}>no click</Button></Dark>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets aria-disabled', () => {
    render(<Dark><Button disabled>disabled</Button></Dark>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('Button — loading', () => {
  it('sets disabled when loading', () => {
    render(<Dark><Button isLoading>Loading</Button></Dark>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy when loading', () => {
    render(<Dark><Button isLoading>Loading</Button></Dark>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('prevents click handler when loading', () => {
    const onClick = vi.fn();
    render(<Dark><Button isLoading onClick={onClick}>no click</Button></Dark>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Click handling
// ---------------------------------------------------------------------------

describe('Button — click', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Dark><Button onClick={onClick}>click me</Button></Dark>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Button — skeleton', () => {
  it('renders skeleton as a div (not a button)', () => {
    const { container } = render(<Dark><Button skeleton /></Dark>);
    const el = container.querySelector('div');
    expect(el).toBeTruthy();
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render button text when skeleton', () => {
    render(<Dark><Button skeleton>Should not appear</Button></Dark>);
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast — button text on button background
// ---------------------------------------------------------------------------

describe('Button — WCAG contrast', () => {
  // Test that each variant's text color has sufficient contrast against its bg
  const isHex = (s: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);

  describe('dark mode', () => {
    buttonVariants.forEach((variant) => {
      it(`"${variant}" text/bg contrast passes AA-large (3:1)`, () => {
        const colors = resolveVariantColors(variant, darkTheme);
        // Skip transparent backgrounds (ghost buttons rely on surface contrast)
        if (!isHex(colors.bg)) return;
        const ratio = contrastRatio(colors.text, colors.bg);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('light mode', () => {
    buttonVariants.forEach((variant) => {
      it(`"${variant}" text/bg contrast passes AA-large (3:1)`, () => {
        const colors = resolveVariantColors(variant, lightTheme);
        if (!isHex(colors.bg)) return;
        const ratio = contrastRatio(colors.text, colors.bg);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
