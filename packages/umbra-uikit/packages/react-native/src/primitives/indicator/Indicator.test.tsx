/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Indicator } from './Indicator';
import { indicatorVariants, indicatorStates, indicatorSizes } from '@coexist/wisp-core/types/Indicator.types';
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

describe('Indicator — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper><Indicator /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with an accessibility label', () => {
    render(
      <Wrapper><Indicator label="Online" /></Wrapper>,
    );
    expect(screen.getByLabelText('Online')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Indicator — variants', () => {
  indicatorVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Indicator variant={variant} label={variant} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

describe('Indicator — states', () => {
  indicatorStates.forEach((state) => {
    it(`renders state="${state}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Indicator state={state} label={state} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Indicator — sizes', () => {
  indicatorSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Indicator size={size} label={size} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});
