/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Icon } from './Icon';
import { iconSizeMap } from '@coexist/wisp-core/types/Icon.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Mock icon component (mimics a Lucide icon)
// ---------------------------------------------------------------------------

const MockIcon = ({
  size,
  color,
  strokeWidth,
}: {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
}) => (
  <svg
    data-testid="mock-icon"
    width={size}
    height={size}
    stroke={color}
    strokeWidth={strokeWidth}
  />
);

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Icon — rendering', () => {
  it('renders the icon component', () => {
    render(<Wrapper><Icon icon={MockIcon} /></Wrapper>);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('is decorative (aria-hidden) by default', () => {
    const { container } = render(<Wrapper><Icon icon={MockIcon} /></Wrapper>);
    const wrapper = container.querySelector('span');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('is semantic with label prop', () => {
    const { container } = render(<Wrapper><Icon icon={MockIcon} label="Search" /></Wrapper>);
    const wrapper = container.querySelector('span');
    expect(wrapper).toHaveAttribute('role', 'img');
    expect(wrapper).toHaveAttribute('aria-label', 'Search');
  });

  it('passes className through', () => {
    const { container } = render(<Wrapper><Icon icon={MockIcon} className="custom" /></Wrapper>);
    const wrapper = container.querySelector('span');
    expect(wrapper).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Icon — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders at size="${size}" (${iconSizeMap[size]}px)`, () => {
      render(<Wrapper><Icon icon={MockIcon} size={size} /></Wrapper>);
      const svg = screen.getByTestId('mock-icon');
      expect(svg).toHaveAttribute('width', String(iconSizeMap[size]));
      expect(svg).toHaveAttribute('height', String(iconSizeMap[size]));
    });
  });
});

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

describe('Icon — colors', () => {
  it('uses currentColor by default', () => {
    render(<Wrapper><Icon icon={MockIcon} /></Wrapper>);
    const svg = screen.getByTestId('mock-icon');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('resolves semantic color "error" to a hex value', () => {
    render(<Wrapper><Icon icon={MockIcon} color="error" /></Wrapper>);
    const svg = screen.getByTestId('mock-icon');
    const stroke = svg.getAttribute('stroke');
    // Should be a hex color, not "error"
    expect(stroke).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('passes raw hex colors through', () => {
    render(<Wrapper><Icon icon={MockIcon} color="#FF0000" /></Wrapper>);
    const svg = screen.getByTestId('mock-icon');
    expect(svg).toHaveAttribute('stroke', '#FF0000');
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Icon — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Wrapper><Icon icon={MockIcon} skeleton /></Wrapper>);
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('aria-hidden');
  });

  it('does not render the svg when skeleton', () => {
    render(<Wrapper><Icon icon={MockIcon} skeleton /></Wrapper>);
    expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// StrokeWidth
// ---------------------------------------------------------------------------

describe('Icon — strokeWidth', () => {
  it('defaults to strokeWidth 2', () => {
    render(<Wrapper><Icon icon={MockIcon} /></Wrapper>);
    const svg = screen.getByTestId('mock-icon');
    expect(svg).toHaveAttribute('stroke-width', '2');
  });

  it('accepts custom strokeWidth', () => {
    render(<Wrapper><Icon icon={MockIcon} strokeWidth={1.5} /></Wrapper>);
    const svg = screen.getByTestId('mock-icon');
    expect(svg).toHaveAttribute('stroke-width', '1.5');
  });
});
