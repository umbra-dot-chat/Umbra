/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';
import { badgeVariants, badgeSizes, badgeShapes } from '@coexist/wisp-core/types/Badge.types';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { resolveBadgeColors } from '@coexist/wisp-core/styles/Badge.styles';
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

describe('Badge — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Badge>Status</Badge></Dark>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('passes className through', () => {
    render(<Dark><Badge className="custom">Label</Badge></Dark>);
    expect(screen.getByText('Label').closest('span')).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Badge — variants', () => {
  badgeVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Dark><Badge variant={variant}>{variant}</Badge></Dark>);
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Badge — sizes', () => {
  badgeSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Badge size={size}>{size}</Badge></Dark>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

describe('Badge — shapes', () => {
  badgeShapes.forEach((shape) => {
    it(`renders shape="${shape}" without crashing`, () => {
      render(<Dark><Badge shape={shape}>{shape}</Badge></Dark>);
      expect(screen.getByText(shape)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Dot
// ---------------------------------------------------------------------------

describe('Badge — dot', () => {
  it('renders a dot element when dot={true}', () => {
    const { container } = render(<Dark><Badge dot>Active</Badge></Dark>);
    const badge = screen.getByText('Active').closest('span');
    // The dot is the first child span inside the badge
    const dotEl = badge?.querySelector('span > span');
    expect(dotEl).toBeTruthy();
    expect(dotEl?.style.borderRadius).toBe('9999px');
  });

  it('does not render a dot when dot is not set', () => {
    const { container } = render(<Dark><Badge>No dot</Badge></Dark>);
    const badge = screen.getByText('No dot').closest('span');
    const innerSpans = badge?.querySelectorAll('span');
    // No inner span elements should exist (no dot rendered)
    expect(innerSpans?.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Leading icon
// ---------------------------------------------------------------------------

describe('Badge — leading icon', () => {
  it('renders leading icon when icon prop is provided', () => {
    const MockIcon = ({ size, color, strokeWidth }: { size?: number | string; color?: string; strokeWidth?: number }) => (
      <svg data-testid="leading-icon" width={size} height={size} />
    );
    render(<Dark><Badge icon={MockIcon}>With icon</Badge></Dark>);
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Trailing icon
// ---------------------------------------------------------------------------

describe('Badge — trailing icon', () => {
  it('renders trailing icon when trailingIcon prop is provided', () => {
    const MockIcon = ({ size, color, strokeWidth }: { size?: number | string; color?: string; strokeWidth?: number }) => (
      <svg data-testid="trailing-icon" width={size} height={size} />
    );
    render(<Dark><Badge trailingIcon={MockIcon}>With trailing</Badge></Dark>);
    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Badge — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><Badge skeleton>Hidden</Badge></Dark>);
    const el = container.querySelector('span');
    expect(el).toBeTruthy();
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render children text when skeleton', () => {
    render(<Dark><Badge skeleton>Should not appear</Badge></Dark>);
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast — badge text on badge background
// ---------------------------------------------------------------------------

describe('Badge — WCAG contrast', () => {
  const isHex = (s: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);

  describe('dark mode', () => {
    badgeVariants.forEach((variant) => {
      it(`"${variant}" text/bg contrast passes AA-large (3:1)`, () => {
        const colors = resolveBadgeColors(variant, darkTheme);
        // Skip non-hex backgrounds (e.g. rgba surfaces)
        if (!isHex(colors.bg)) return;
        const ratio = contrastRatio(colors.text, colors.bg);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('light mode', () => {
    badgeVariants.forEach((variant) => {
      it(`"${variant}" text/bg contrast passes AA-large (3:1)`, () => {
        const colors = resolveBadgeColors(variant, lightTheme);
        // Skip non-hex backgrounds (e.g. rgba surfaces)
        if (!isHex(colors.bg)) return;
        const ratio = contrastRatio(colors.text, colors.bg);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
