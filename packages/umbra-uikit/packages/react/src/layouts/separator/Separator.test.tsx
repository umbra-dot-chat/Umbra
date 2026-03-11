/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Separator } from './Separator';
import { separatorOrientations, separatorVariants, separatorSpacings, separatorSpacingMap } from '@coexist/wisp-core/types/Separator.types';
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

describe('Separator — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dark><Separator /></Dark>);
    expect(container.querySelector('[role="separator"]')).toBeInTheDocument();
  });

  it('passes className through', () => {
    const { container } = render(<Dark><Separator className="custom" /></Dark>);
    const el = container.querySelector('[role="separator"]');
    expect(el).toHaveClass('custom');
  });

  it('merges user style with computed style', () => {
    const { container } = render(
      <Dark><Separator style={{ opacity: 0.5 }} /></Dark>,
    );
    const el = container.querySelector('[role="separator"]') as HTMLElement;
    expect(el.style.opacity).toBe('0.5');
  });

  it('renders in light mode without crashing', () => {
    const { container } = render(<Light><Separator /></Light>);
    expect(container.querySelector('[role="separator"]')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

describe('Separator — orientation', () => {
  it('defaults to horizontal orientation', () => {
    const { container } = render(<Dark><Separator /></Dark>);
    const el = container.querySelector('[role="separator"]');
    expect(el).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders horizontal orientation explicitly', () => {
    const { container } = render(<Dark><Separator orientation="horizontal" /></Dark>);
    const el = container.querySelector('[role="separator"]');
    expect(el).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders vertical orientation', () => {
    const { container } = render(<Dark><Separator orientation="vertical" /></Dark>);
    const el = container.querySelector('[role="separator"]');
    expect(el).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('horizontal separator has full width and 1px height', () => {
    const { container } = render(<Dark><Separator spacing="none" /></Dark>);
    const el = container.querySelector('[role="separator"]') as HTMLElement;
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('1px');
  });

  it('vertical separator has 1px width', () => {
    const { container } = render(<Dark><Separator orientation="vertical" spacing="none" /></Dark>);
    const el = container.querySelector('[role="separator"]') as HTMLElement;
    expect(el.style.width).toBe('1px');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Separator — variants', () => {
  separatorVariants.forEach((variant) => {
    it('renders variant="${variant}" without crashing'.replace('${variant}', variant), () => {
      const { container } = render(<Dark><Separator variant={variant} /></Dark>);
      expect(container.querySelector('[role="separator"]')).toBeInTheDocument();
    });
  });

  it('subtle and strong variants produce different background colors', () => {
    const { container: c1 } = render(<Dark><Separator variant="subtle" /></Dark>);
    const { container: c2 } = render(<Dark><Separator variant="strong" /></Dark>);
    const subtleEl = c1.querySelector('[role="separator"]') as HTMLElement;
    const strongEl = c2.querySelector('[role="separator"]') as HTMLElement;
    expect(subtleEl.style.backgroundColor).not.toBe(strongEl.style.backgroundColor);
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('Separator — label', () => {
  it('renders a string label', () => {
    render(<Dark><Separator label="OR" /></Dark>);
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('renders a ReactNode label', () => {
    render(<Dark><Separator label={<strong data-testid="label-node">Section</strong>} /></Dark>);
    expect(screen.getByTestId('label-node')).toBeInTheDocument();
  });

  it('label has font size of 12px', () => {
    render(<Dark><Separator label="Test" /></Dark>);
    const labelEl = screen.getByText('Test');
    expect(labelEl.style.fontSize).toBe('12px');
  });

  it('renders two line segments when label is present', () => {
    const { container } = render(<Dark><Separator label="OR" /></Dark>);
    const separator = container.querySelector('[role="separator"]');
    // Two line divs + one label span = 3 children
    expect(separator?.children.length).toBe(3);
  });

  it('does not render label content when no label is provided', () => {
    const { container } = render(<Dark><Separator /></Dark>);
    const separator = container.querySelector('[role="separator"]');
    // No children for a simple line
    expect(separator?.children.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

describe('Separator — spacing', () => {
  separatorSpacings.forEach((sp) => {
    it('renders spacing="${sp}" without crashing'.replace('${sp}', sp), () => {
      const { container } = render(<Dark><Separator spacing={sp} /></Dark>);
      expect(container.querySelector('[role="separator"]')).toBeInTheDocument();
    });
  });

  it('applies correct margin-top and margin-bottom for horizontal', () => {
    const { container } = render(<Dark><Separator spacing="lg" /></Dark>);
    const el = container.querySelector('[role="separator"]') as HTMLElement;
    expect(el.style.marginTop).toBe('24px');
    expect(el.style.marginBottom).toBe('24px');
  });

  it('applies correct margin-left and margin-right for vertical', () => {
    const { container } = render(<Dark><Separator orientation="vertical" spacing="lg" /></Dark>);
    const el = container.querySelector('[role="separator"]') as HTMLElement;
    expect(el.style.marginLeft).toBe('24px');
    expect(el.style.marginRight).toBe('24px');
  });

  it('no spacing applies 0px margins', () => {
    const { container } = render(<Dark><Separator spacing="none" /></Dark>);
    const el = container.querySelector('[role="separator"]') as HTMLElement;
    expect(el.style.marginTop).toBe('0px');
    expect(el.style.marginBottom).toBe('0px');
  });

  it('defaults to md spacing (16px)', () => {
    const { container } = render(<Dark><Separator /></Dark>);
    const el = container.querySelector('[role="separator"]') as HTMLElement;
    expect(el.style.marginTop).toBe('16px');
    expect(el.style.marginBottom).toBe('16px');
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe('Separator — aria attributes', () => {
  it('has role="separator"', () => {
    const { container } = render(<Dark><Separator /></Dark>);
    expect(container.querySelector('[role="separator"]')).toBeInTheDocument();
  });

  it('has aria-orientation="horizontal" by default', () => {
    const { container } = render(<Dark><Separator /></Dark>);
    const el = container.querySelector('[role="separator"]');
    expect(el).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('has aria-orientation="vertical" when orientation is vertical', () => {
    const { container } = render(<Dark><Separator orientation="vertical" /></Dark>);
    const el = container.querySelector('[role="separator"]');
    expect(el).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('forwards additional HTML attributes', () => {
    const { container } = render(<Dark><Separator data-testid="sep" id="my-sep" /></Dark>);
    const el = container.querySelector('[role="separator"]');
    expect(el).toHaveAttribute('data-testid', 'sep');
    expect(el).toHaveAttribute('id', 'my-sep');
  });
});
