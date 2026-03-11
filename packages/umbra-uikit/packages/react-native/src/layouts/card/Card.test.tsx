/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';
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

describe('Card — rendering', () => {
  it('renders children text', () => {
    render(
      <Wrapper>
        <Card>Card content</Card>
      </Wrapper>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(
      <Wrapper>
        <Card />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders nested children', () => {
    render(
      <Wrapper>
        <Card>
          <span>Header</span>
          <span>Body</span>
        </Card>
      </Wrapper>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Card — variants', () => {
  const variants = ['elevated', 'outlined', 'filled'] as const;

  variants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(
        <Wrapper>
          <Card variant={variant}>{variant}</Card>
        </Wrapper>,
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });

  it('applies border for outlined variant', () => {
    render(
      <Wrapper>
        <Card variant="outlined" testID="card">Outlined</Card>
      </Wrapper>,
    );
    const el = screen.getByTestId('card');
    // react-native-web expands borderWidth into individual side properties
    expect(el.style.borderTopWidth).toBe('1px');
  });

  it('applies no border for filled variant', () => {
    render(
      <Wrapper>
        <Card variant="filled" testID="card">Filled</Card>
      </Wrapper>,
    );
    const el = screen.getByTestId('card');
    // react-native-web expands borderWidth into individual side properties
    const bw = el.style.borderTopWidth;
    expect(bw === '0px' || bw === '0').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Padding
// ---------------------------------------------------------------------------

describe('Card — padding', () => {
  const paddings = ['none', 'sm', 'md', 'lg'] as const;

  paddings.forEach((padding) => {
    it(`renders padding="${padding}" without crashing`, () => {
      render(
        <Wrapper>
          <Card padding={padding}>{padding}</Card>
        </Wrapper>,
      );
      expect(screen.getByText(padding)).toBeInTheDocument();
    });
  });

  it('applies padding="none" (0px)', () => {
    render(
      <Wrapper>
        <Card padding="none" testID="card">Content</Card>
      </Wrapper>,
    );
    const p = screen.getByTestId('card').style.padding;
    expect(p === '0' || p === '0px').toBe(true);
  });

  it('applies padding="sm" (12px)', () => {
    render(
      <Wrapper>
        <Card padding="sm" testID="card">Content</Card>
      </Wrapper>,
    );
    expect(screen.getByTestId('card').style.padding).toBe('12px');
  });

  it('applies padding="md" (16px)', () => {
    render(
      <Wrapper>
        <Card padding="md" testID="card">Content</Card>
      </Wrapper>,
    );
    expect(screen.getByTestId('card').style.padding).toBe('16px');
  });

  it('applies padding="lg" (24px)', () => {
    render(
      <Wrapper>
        <Card padding="lg" testID="card">Content</Card>
      </Wrapper>,
    );
    expect(screen.getByTestId('card').style.padding).toBe('24px');
  });
});

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

describe('Card — radius', () => {
  const radii = ['none', 'sm', 'md', 'lg'] as const;

  radii.forEach((radius) => {
    it(`renders radius="${radius}" without crashing`, () => {
      render(
        <Wrapper>
          <Card radius={radius}>{radius}</Card>
        </Wrapper>,
      );
      expect(screen.getByText(radius)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Card — disabled', () => {
  it('applies opacity when disabled', () => {
    render(
      <Wrapper>
        <Card disabled testID="card">Disabled card</Card>
      </Wrapper>,
    );
    expect(screen.getByTestId('card').style.opacity).toBe('0.5');
  });

  it('full opacity when not disabled', () => {
    render(
      <Wrapper>
        <Card testID="card">Enabled card</Card>
      </Wrapper>,
    );
    expect(screen.getByTestId('card').style.opacity).toBe('1');
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('Card — displayName', () => {
  it('has correct displayName', () => {
    expect(Card.displayName).toBe('Card');
  });
});
