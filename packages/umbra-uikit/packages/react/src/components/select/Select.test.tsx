/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from './Select';
import { selectSizes } from '@coexist/wisp-core/types/Select.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const defaultOptions = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'fr', label: 'France' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Select — rendering', () => {
  it('renders a combobox trigger', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders placeholder text by default', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    expect(screen.getByText('Select\u2026')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<Dark><Select options={defaultOptions} placeholder="Pick one" /></Dark>);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    expect(screen.getByRole('combobox').tagName).toBe('BUTTON');
  });
});

// ---------------------------------------------------------------------------
// Label and hint
// ---------------------------------------------------------------------------

describe('Select — label & hint', () => {
  it('renders label text', () => {
    render(<Dark><Select label="Country" options={defaultOptions} /></Dark>);
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(<Dark><Select hint="Choose your country" options={defaultOptions} /></Dark>);
    expect(screen.getByText('Choose your country')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Controlled / Uncontrolled
// ---------------------------------------------------------------------------

describe('Select — controlled / uncontrolled', () => {
  it('displays controlled value label', () => {
    render(<Dark><Select options={defaultOptions} value="gb" /></Dark>);
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('displays defaultValue label in uncontrolled mode', () => {
    render(<Dark><Select options={defaultOptions} defaultValue="fr" /></Dark>);
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(<Dark><Select options={defaultOptions} onChange={onChange} /></Dark>);
    // Open dropdown
    fireEvent.click(screen.getByRole('combobox'));
    // Click option
    fireEvent.click(screen.getByText('United Kingdom'));
    expect(onChange).toHaveBeenCalledWith('gb');
  });
});

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------

describe('Select — dropdown', () => {
  it('opens listbox on trigger click', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('renders all options in dropdown', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    fireEvent.click(screen.getByRole('combobox'));
    const opts = screen.getAllByRole('option');
    expect(opts).toHaveLength(3);
  });

  it('closes dropdown on option select', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('France'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('sets aria-expanded on trigger', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks selected option with aria-selected', () => {
    render(<Dark><Select options={defaultOptions} value="us" /></Dark>);
    fireEvent.click(screen.getByRole('combobox'));
    const opts = screen.getAllByRole('option');
    expect(opts[0]).toHaveAttribute('aria-selected', 'true');
    expect(opts[1]).toHaveAttribute('aria-selected', 'false');
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('Select — keyboard', () => {
  it('opens dropdown on ArrowDown', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes dropdown on Escape', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects highlighted option on Enter', () => {
    const onChange = vi.fn();
    render(<Dark><Select options={defaultOptions} onChange={onChange} /></Dark>);
    const trigger = screen.getByRole('combobox');
    // Open and highlight first option
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    // Select it
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('us');
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Select — disabled', () => {
  it('disables the trigger button', () => {
    render(<Dark><Select options={defaultOptions} disabled /></Dark>);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('does not open dropdown when disabled', () => {
    render(<Dark><Select options={defaultOptions} disabled /></Dark>);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks disabled options with aria-disabled', () => {
    const opts = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    render(<Dark><Select options={opts} /></Dark>);
    fireEvent.click(screen.getByRole('combobox'));
    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-disabled', 'true');
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('Select — error', () => {
  it('renders error message string', () => {
    render(<Dark><Select options={defaultOptions} error="Required" /></Dark>);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('error replaces hint text', () => {
    render(<Dark><Select options={defaultOptions} hint="Pick one" error="Required" /></Dark>);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Pick one')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Select — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    render(<Dark><Select skeleton options={defaultOptions} /></Dark>);
    const el = screen.getByTestId('select-skeleton');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render combobox when skeleton', () => {
    render(<Dark><Select skeleton options={defaultOptions} /></Dark>);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Select — sizes', () => {
  selectSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Select size={size} options={defaultOptions} /></Dark>);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Leading icon
// ---------------------------------------------------------------------------

describe('Select — leading icon', () => {
  it('renders leadingIcon', () => {
    const icon = <svg data-testid="lead-icon" />;
    render(<Dark><Select options={defaultOptions} leadingIcon={icon} /></Dark>);
    expect(screen.getByTestId('lead-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// className and style
// ---------------------------------------------------------------------------

describe('Select — className and style', () => {
  it('passes className through', () => {
    const { container } = render(<Dark><Select options={defaultOptions} className="custom" /></Dark>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('merges user style', () => {
    const { container } = render(<Dark><Select options={defaultOptions} style={{ marginTop: 33 }} /></Dark>);
    expect((container.firstChild as HTMLElement).style.marginTop).toBe('33px');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Select — ref forwarding', () => {
  it('forwards ref to wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Dark><Select ref={ref} options={defaultOptions} /></Dark>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Select — accessibility', () => {
  it('has aria-haspopup="listbox"', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('trigger is type="button"', () => {
    render(<Dark><Select options={defaultOptions} /></Dark>);
    expect(screen.getByRole('combobox')).toHaveAttribute('type', 'button');
  });
});
