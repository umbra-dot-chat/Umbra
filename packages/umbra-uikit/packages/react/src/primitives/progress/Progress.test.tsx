/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Progress } from './Progress';
import { progressSizeMap } from '@coexist/wisp-core/types/Progress.types';
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

describe('Progress — rendering', () => {
  it('renders with role="progressbar"', () => {
    render(<Dark><Progress value={50} /></Dark>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders as a div element', () => {
    const { container } = render(<Dark><Progress value={50} /></Dark>);
    const wrapper = container.firstChild;
    expect(wrapper).toBeTruthy();
    expect((wrapper as HTMLElement).tagName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe('Progress — aria attributes', () => {
  it('has aria-valuenow set to the current value', () => {
    render(<Dark><Progress value={42} /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
  });

  it('has aria-valuemin set to 0', () => {
    render(<Dark><Progress value={50} /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
  });

  it('has aria-valuemax set to max', () => {
    render(<Dark><Progress value={50} max={200} /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '200');
  });

  it('defaults aria-valuemax to 100', () => {
    render(<Dark><Progress value={50} /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});

// ---------------------------------------------------------------------------
// Value clamping
// ---------------------------------------------------------------------------

describe('Progress — value clamping', () => {
  it('clamps value above max to max', () => {
    render(<Dark><Progress value={150} max={100} /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps negative value to 0', () => {
    render(<Dark><Progress value={-20} max={100} /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('Progress — label', () => {
  it('renders label text when provided', () => {
    render(<Dark><Progress value={50} label="Loading..." /></Dark>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render label row when no label and no showValue', () => {
    const { container } = render(<Dark><Progress value={50} /></Dark>);
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Value display
// ---------------------------------------------------------------------------

describe('Progress — value display', () => {
  it('shows percentage when showValue is true', () => {
    render(<Dark><Progress value={75} showValue /></Dark>);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('does not show value when showValue is false', () => {
    const { container } = render(<Dark><Progress value={75} /></Dark>);
    expect(container.textContent).toBe('');
  });

  it('shows both label and value', () => {
    render(<Dark><Progress value={50} label="Upload" showValue /></Dark>);
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Custom formatValue
// ---------------------------------------------------------------------------

describe('Progress — custom formatValue', () => {
  it('uses custom formatter', () => {
    render(
      <Dark>
        <Progress
          value={750}
          max={1000}
          showValue
          formatValue={(v, m) => `${v} / ${m} MB`}
        />
      </Dark>,
    );
    expect(screen.getByText('750 / 1000 MB')).toBeInTheDocument();
  });

  it('uses custom formatter with steps', () => {
    render(
      <Dark>
        <Progress
          value={3}
          max={5}
          showValue
          formatValue={(v, m) => `${v} of ${m}`}
        />
      </Dark>,
    );
    expect(screen.getByText('3 of 5')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Indeterminate mode
// ---------------------------------------------------------------------------

describe('Progress — indeterminate', () => {
  it('renders progressbar without aria-valuenow when indeterminate', () => {
    render(<Dark><Progress indeterminate /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
  });

  it('does not have aria-valuemax when indeterminate', () => {
    render(<Dark><Progress indeterminate /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuemax');
  });

  it('still has aria-valuemin=0 when indeterminate', () => {
    render(<Dark><Progress indeterminate /></Dark>);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
  });

  it('does not show value text when indeterminate even with showValue', () => {
    const { container } = render(
      <Dark><Progress indeterminate showValue /></Dark>,
    );
    // Should not contain a percentage text
    const spans = container.querySelectorAll('span');
    const hasPercentage = Array.from(spans).some((span) =>
      span.textContent?.includes('%'),
    );
    expect(hasPercentage).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Progress — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" with correct track height`, () => {
      render(<Dark><Progress size={size} value={50} /></Dark>);
      const bar = screen.getByRole('progressbar');
      const expected = progressSizeMap[size].height;
      expect(bar.style.height).toBe(`${expected}px`);
    });
  });

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Dark><Progress size={size} value={50} /></Dark>,
      );
      expect(container.firstChild).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Progress — skeleton', () => {
  it('renders with aria-hidden when skeleton', () => {
    const { container } = render(<Dark><Progress skeleton /></Dark>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render a progressbar role when skeleton', () => {
    render(<Dark><Progress skeleton /></Dark>);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Color variants
// ---------------------------------------------------------------------------

describe('Progress — color variants', () => {
  const variants = ['default', 'success', 'warning', 'danger', 'info'] as const;

  variants.forEach((color) => {
    it(`renders color="${color}" without crashing`, () => {
      const { container } = render(
        <Dark><Progress value={50} color={color} /></Dark>,
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  variants.forEach((color) => {
    it(`renders color="${color}" in light mode without crashing`, () => {
      const { container } = render(
        <Light><Progress value={50} color={color} /></Light>,
      );
      expect(container.firstChild).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Props passthrough
// ---------------------------------------------------------------------------

describe('Progress — props', () => {
  it('passes className through', () => {
    const { container } = render(
      <Dark><Progress value={50} className="custom-progress" /></Dark>,
    );
    expect(container.querySelector('.custom-progress')).toBeTruthy();
  });

  it('spreads additional div attributes', () => {
    render(<Dark><Progress value={50} data-testid="my-progress" /></Dark>);
    expect(screen.getByTestId('my-progress')).toBeInTheDocument();
  });

  it('merges user style with computed style', () => {
    const { container } = render(
      <Dark><Progress value={50} style={{ marginTop: 20 }} /></Dark>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.marginTop).toBe('20px');
  });
});
