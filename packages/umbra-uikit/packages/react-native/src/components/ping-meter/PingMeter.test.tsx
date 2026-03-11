/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PingMeter } from './PingMeter';
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

describe('PingMeter — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <PingMeter latency={42} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders the latency value as text', () => {
    render(
      <Wrapper>
        <PingMeter latency={42} />
      </Wrapper>,
    );
    expect(screen.getByText('42ms')).toBeInTheDocument();
  });

  it('renders a different latency value', () => {
    render(
      <Wrapper>
        <PingMeter latency={150} />
      </Wrapper>,
    );
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('has the latency accessibility label', () => {
    const { container } = render(
      <Wrapper>
        <PingMeter latency={75} />
      </Wrapper>,
    );
    const labeled = container.querySelector('[aria-label="Latency: 75ms"]');
    expect(labeled).toBeTruthy();
  });

  it('has correct displayName', () => {
    expect(PingMeter.displayName).toBe('PingMeter');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('PingMeter — variants', () => {
  const variants = ['dot', 'bars', 'full'] as const;

  variants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      const { container } = render(
        <Wrapper>
          <PingMeter latency={60} variant={variant} />
        </Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});
