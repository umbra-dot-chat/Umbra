/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Icon } from './Icon';
import { iconSizeMap } from '@coexist/wisp-core/types/Icon.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Mock icon component (mimics a Lucide-style icon)
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
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Icon icon={MockIcon} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders the icon component', () => {
    render(
      <Wrapper>
        <Icon icon={MockIcon} />
      </Wrapper>,
    );
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('is semantic with label prop', () => {
    render(
      <Wrapper>
        <Icon icon={MockIcon} label="Search" />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Applies size
// ---------------------------------------------------------------------------

describe('Icon — applies size', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders at size="${size}" (${iconSizeMap[size]}px)`, () => {
      render(
        <Wrapper>
          <Icon icon={MockIcon} size={size} />
        </Wrapper>,
      );
      const svg = screen.getByTestId('mock-icon');
      expect(svg).toHaveAttribute('width', String(iconSizeMap[size]));
      expect(svg).toHaveAttribute('height', String(iconSizeMap[size]));
    });
  });

  it('defaults to md size', () => {
    render(
      <Wrapper>
        <Icon icon={MockIcon} />
      </Wrapper>,
    );
    const svg = screen.getByTestId('mock-icon');
    expect(svg).toHaveAttribute('width', String(iconSizeMap.md));
    expect(svg).toHaveAttribute('height', String(iconSizeMap.md));
  });
});

// ---------------------------------------------------------------------------
// Applies color
// ---------------------------------------------------------------------------

describe('Icon — applies color', () => {
  it('resolves semantic color "error" to a hex value', () => {
    render(
      <Wrapper>
        <Icon icon={MockIcon} color="error" />
      </Wrapper>,
    );
    const svg = screen.getByTestId('mock-icon');
    const stroke = svg.getAttribute('stroke');
    // Should be a hex color, not the string "error"
    expect(stroke).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('passes raw hex colors through', () => {
    render(
      <Wrapper>
        <Icon icon={MockIcon} color="#FF0000" />
      </Wrapper>,
    );
    const svg = screen.getByTestId('mock-icon');
    expect(svg).toHaveAttribute('stroke', '#FF0000');
  });

  it('applies a resolved color for the default "primary" value', () => {
    render(
      <Wrapper>
        <Icon icon={MockIcon} />
      </Wrapper>,
    );
    const svg = screen.getByTestId('mock-icon');
    const stroke = svg.getAttribute('stroke');
    // Default color="primary" should resolve to a theme color string
    expect(stroke).toBeTruthy();
    expect(stroke).not.toBe('primary');
  });
});
