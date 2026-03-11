/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './Skeleton';
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

describe('Skeleton — rendering', () => {
  it('renders without crashing (default rectangular)', () => {
    const { container } = render(
      <Wrapper><Skeleton /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Shapes (variants)
// ---------------------------------------------------------------------------

describe('Skeleton — shapes', () => {
  const variants = ['rectangular', 'circular', 'text'] as const;

  variants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Skeleton variant={variant} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });

  it('renders circular with custom size', () => {
    const { container } = render(
      <Wrapper><Skeleton variant="circular" width={64} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders text with multiple lines', () => {
    const { container } = render(
      <Wrapper><Skeleton variant="text" lines={5} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Custom dimensions
// ---------------------------------------------------------------------------

describe('Skeleton — custom dimensions', () => {
  it('renders with custom width and height', () => {
    const { container } = render(
      <Wrapper><Skeleton width={200} height={100} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with string width', () => {
    const { container } = render(
      <Wrapper><Skeleton width="50%" height={80} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with custom radius', () => {
    const { container } = render(
      <Wrapper><Skeleton width={120} height={60} radius={16} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders text variant with custom lineHeight and lineSpacing', () => {
    const { container } = render(
      <Wrapper>
        <Skeleton variant="text" lineHeight={20} lineSpacing={12} lines={4} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});
