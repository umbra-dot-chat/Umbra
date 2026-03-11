/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Chip } from './Chip';
import { chipSizes, chipColors, chipVariants } from '@coexist/wisp-core/types/Chip.types';
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

describe('Chip — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Chip>Status</Chip></Dark>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Chip — sizes', () => {
  chipSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Chip size={size}>{size}</Chip></Dark>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

describe('Chip — colors', () => {
  chipColors.forEach((color) => {
    it(`renders color="${color}" without crashing`, () => {
      render(<Dark><Chip color={color}>{color}</Chip></Dark>);
      expect(screen.getByText(color)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Style Variants
// ---------------------------------------------------------------------------

describe('Chip — style variants', () => {
  chipVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Dark><Chip variant={variant}>{variant}</Chip></Dark>);
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Removable
// ---------------------------------------------------------------------------

describe('Chip — removable', () => {
  it('renders a remove button when removable', () => {
    render(<Dark><Chip removable>Removable</Chip></Dark>);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(<Dark><Chip removable onRemove={handleRemove}>Tag</Chip></Dark>);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('remove button has aria-label="Remove"', () => {
    render(<Dark><Chip removable>Label</Chip></Dark>);
    const btn = screen.getByRole('button', { name: 'Remove' });
    expect(btn).toHaveAttribute('aria-label', 'Remove');
  });

  it('does not render remove button when not removable', () => {
    render(<Dark><Chip>No remove</Chip></Dark>);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Clickable
// ---------------------------------------------------------------------------

describe('Chip — clickable', () => {
  it('has role="button" when clickable', () => {
    render(<Dark><Chip clickable>Click me</Chip></Dark>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has tabIndex=0 when clickable and not disabled', () => {
    render(<Dark><Chip clickable>Focusable</Chip></Dark>);
    const el = screen.getByRole('button');
    expect(el).toHaveAttribute('tabindex', '0');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Dark><Chip clickable onClick={handleClick}>Clickable</Chip></Dark>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not have role="button" when not clickable', () => {
    render(<Dark><Chip>Not clickable</Chip></Dark>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Chip — disabled', () => {
  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Dark><Chip clickable disabled onClick={handleClick}>Disabled</Chip></Dark>);
    fireEvent.click(screen.getByText('Disabled'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onRemove when disabled', () => {
    const handleRemove = vi.fn();
    render(
      <Dark>
        <Chip removable disabled onRemove={handleRemove}>
          Disabled removable
        </Chip>
      </Dark>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(handleRemove).not.toHaveBeenCalled();
  });

  it('does not set tabIndex when clickable but disabled', () => {
    render(<Dark><Chip clickable disabled>No tab</Chip></Dark>);
    const el = screen.getByText('No tab').closest('div');
    expect(el).not.toHaveAttribute('tabindex');
  });
});

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

describe('Chip — icon', () => {
  it('renders icon element when icon prop is provided', () => {
    const icon = <svg data-testid="chip-icon" />;
    render(<Dark><Chip icon={icon}>With icon</Chip></Dark>);
    expect(screen.getByTestId('chip-icon')).toBeInTheDocument();
  });

  it('does not render icon wrapper when icon is not provided', () => {
    const { container } = render(<Dark><Chip>No icon</Chip></Dark>);
    // The chip's direct children should only be the text span (no icon wrapper span)
    const chip = screen.getByText('No icon').closest('div');
    const spans = chip?.querySelectorAll(':scope > span');
    expect(spans?.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Chip — className passthrough', () => {
  it('passes className through to the root element', () => {
    render(<Dark><Chip className="custom-chip">Styled</Chip></Dark>);
    const el = screen.getByText('Styled').closest('div');
    expect(el).toHaveClass('custom-chip');
  });
});
