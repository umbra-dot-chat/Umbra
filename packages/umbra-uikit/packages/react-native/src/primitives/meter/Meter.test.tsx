/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Meter } from './Meter';
import { meterSizes, meterVariants } from '@coexist/wisp-core/types/Meter.types';
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

describe('Meter — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper><Meter value={50} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with a label', () => {
    render(
      <Wrapper><Meter value={60} label="Disk usage" /></Wrapper>,
    );
    expect(screen.getByText('Disk usage')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Value prop
// ---------------------------------------------------------------------------

describe('Meter — value', () => {
  it('renders with value=0', () => {
    const { container } = render(
      <Wrapper><Meter value={0} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with value=100', () => {
    const { container } = render(
      <Wrapper><Meter value={100} /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('displays formatted value when showValue is true', () => {
    render(
      <Wrapper><Meter value={75} showValue /></Wrapper>,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('clamps value above max', () => {
    render(
      <Wrapper><Meter value={150} max={100} showValue /></Wrapper>,
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clamps value below min', () => {
    render(
      <Wrapper><Meter value={-10} min={0} max={100} showValue /></Wrapper>,
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders with custom min and max', () => {
    render(
      <Wrapper><Meter value={50} min={0} max={200} showValue /></Wrapper>,
    );
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Meter — variants', () => {
  meterVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Meter value={50} variant={variant} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Meter — sizes', () => {
  meterSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Meter value={50} size={size} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Meter — disabled', () => {
  it('renders in disabled state without crashing', () => {
    const { container } = render(
      <Wrapper><Meter value={50} disabled /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});
