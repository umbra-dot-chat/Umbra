/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';
import { badgeVariants, badgeSizes } from '@coexist/wisp-core/types/Badge.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Badge — rendering', () => {
  it('renders label text', () => {
    render(<Wrapper><Badge>New</Badge></Wrapper>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders with dot prop', () => {
    const { container } = render(<Wrapper><Badge dot>Status</Badge></Wrapper>);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Badge — variants', () => {
  badgeVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Wrapper><Badge variant={variant}>{variant}</Badge></Wrapper>);
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
      render(<Wrapper><Badge size={size}>{size}</Badge></Wrapper>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

describe('Badge — shapes', () => {
  const shapes = ['pill', 'rounded'] as const;

  shapes.forEach((shape) => {
    it(`renders shape="${shape}" without crashing`, () => {
      render(<Wrapper><Badge shape={shape}>{shape}</Badge></Wrapper>);
      expect(screen.getByText(shape)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

describe('Badge — icon', () => {
  it('renders with a leading icon component', () => {
    const MockIcon = ({ size, color }: { size?: number | string; color?: string }) => (
      <span data-testid="badge-icon" />
    );
    render(
      <Wrapper><Badge icon={MockIcon}>Tagged</Badge></Wrapper>,
    );
    expect(screen.getByText('Tagged')).toBeInTheDocument();
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  it('renders with a trailing icon component', () => {
    const MockIcon = ({ size, color }: { size?: number | string; color?: string }) => (
      <span data-testid="badge-trailing" />
    );
    render(
      <Wrapper><Badge trailingIcon={MockIcon}>Close</Badge></Wrapper>,
    );
    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.getByTestId('badge-trailing')).toBeInTheDocument();
  });
});
