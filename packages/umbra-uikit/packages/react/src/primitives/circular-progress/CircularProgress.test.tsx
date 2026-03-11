/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CircularProgress } from './CircularProgress';
import { circularProgressSizes, circularProgressVariants } from '@coexist/wisp-core/types/CircularProgress.types';
import { WispProvider } from '../../providers';

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

describe('CircularProgress — rendering', () => {
  it('renders with role="progressbar"', () => {
    render(<Dark><CircularProgress value={50} /></Dark>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders an SVG element inside the component', () => {
    const { container } = render(<Dark><CircularProgress value={50} /></Dark>);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('CircularProgress — sizes', () => {
  circularProgressSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><CircularProgress size={size} value={50} /></Dark>);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('CircularProgress — variants', () => {
  circularProgressVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Dark><CircularProgress variant={variant} value={50} /></Dark>);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Value & ARIA
// ---------------------------------------------------------------------------

describe('CircularProgress — value & ARIA', () => {
  it('sets aria-valuenow to the provided value', () => {
    render(<Dark><CircularProgress value={42} /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuenow', '42');
  });

  it('sets aria-valuemax to the provided max', () => {
    render(<Dark><CircularProgress value={30} max={200} /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuemax', '200');
  });

  it('always sets aria-valuemin to 0', () => {
    render(<Dark><CircularProgress value={10} /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuemin', '0');
  });

  it('clamps value to max', () => {
    render(<Dark><CircularProgress value={150} max={100} /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps negative value to 0', () => {
    render(<Dark><CircularProgress value={-10} /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuenow', '0');
  });
});

// ---------------------------------------------------------------------------
// showValue
// ---------------------------------------------------------------------------

describe('CircularProgress — showValue', () => {
  it('displays percentage text when showValue is true', () => {
    render(<Dark><CircularProgress value={75} showValue /></Dark>);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('does not display percentage text when showValue is false', () => {
    render(<Dark><CircularProgress value={75} /></Dark>);
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('calculates percentage relative to max', () => {
    render(<Dark><CircularProgress value={50} max={200} showValue /></Dark>);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// formatValue
// ---------------------------------------------------------------------------

describe('CircularProgress — formatValue', () => {
  it('uses a custom formatter when provided', () => {
    const formatter = (value: number, max: number) => `${value} of ${max}`;
    render(
      <Dark>
        <CircularProgress value={30} max={100} showValue formatValue={formatter} />
      </Dark>,
    );
    expect(screen.getByText('30 of 100')).toBeInTheDocument();
  });

  it('calls the formatter with clamped value and max', () => {
    const formatter = vi.fn((value: number, max: number) => `${value}/${max}`);
    render(
      <Dark>
        <CircularProgress value={150} max={100} showValue formatValue={formatter} />
      </Dark>,
    );
    expect(formatter).toHaveBeenCalledWith(100, 100);
  });
});

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

describe('CircularProgress — children', () => {
  it('renders children in the center', () => {
    render(
      <Dark>
        <CircularProgress value={50}>
          <span data-testid="custom-content">Custom</span>
        </CircularProgress>
      </Dark>,
    );
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('children override showValue content', () => {
    render(
      <Dark>
        <CircularProgress value={50} showValue>
          <span>Override</span>
        </CircularProgress>
      </Dark>,
    );
    expect(screen.getByText('Override')).toBeInTheDocument();
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Indeterminate
// ---------------------------------------------------------------------------

describe('CircularProgress — indeterminate', () => {
  it('does not set aria-valuenow when indeterminate', () => {
    render(<Dark><CircularProgress indeterminate /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).not.toHaveAttribute('aria-valuenow');
  });

  it('does not set aria-valuemax when indeterminate', () => {
    render(<Dark><CircularProgress indeterminate /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).not.toHaveAttribute('aria-valuemax');
  });

  it('still sets aria-valuemin when indeterminate', () => {
    render(<Dark><CircularProgress indeterminate /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuemin', '0');
  });

  it('does not show value text when indeterminate and showValue is true', () => {
    render(<Dark><CircularProgress indeterminate showValue value={50} /></Dark>);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('CircularProgress — label', () => {
  it('sets aria-label attribute when label is provided', () => {
    render(<Dark><CircularProgress value={50} label="Upload progress" /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-label', 'Upload progress');
  });

  it('renders visible label text below the ring', () => {
    render(<Dark><CircularProgress value={50} label="Loading" /></Dark>);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('does not set aria-label when label is not provided', () => {
    render(<Dark><CircularProgress value={50} /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).not.toHaveAttribute('aria-label');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('CircularProgress — className', () => {
  it('passes className to the root element', () => {
    render(<Dark><CircularProgress value={50} className="custom-class" /></Dark>);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveClass('custom-class');
  });
});
