/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './Checkbox';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { resolveCheckboxColors } from '@coexist/wisp-core/styles/Checkbox.styles';
import { createTheme } from '@coexist/wisp-core/theme/create-theme';

const darkTheme = createTheme({ mode: 'dark' });
const lightTheme = createTheme({ mode: 'light' });

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

describe('Checkbox — rendering', () => {
  it('renders as a label with role="checkbox"', () => {
    render(<Dark><Checkbox label="test" /></Dark>);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders as a label element', () => {
    render(<Dark><Checkbox label="test" /></Dark>);
    expect(screen.getByRole('checkbox').tagName).toBe('LABEL');
  });

  it('contains a hidden input[type="checkbox"]', () => {
    const { container } = render(<Dark><Checkbox label="test" /></Dark>);
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).toBeInTheDocument();
  });

  it('passes className through', () => {
    render(<Dark><Checkbox label="test" className="custom" /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveClass('custom');
  });

  it('renders label text', () => {
    render(<Dark><Checkbox label="Subscribe" /></Dark>);
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<Dark><Checkbox label="Subscribe" description="Get updates" /></Dark>);
    expect(screen.getByText('Get updates')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Uncontrolled
// ---------------------------------------------------------------------------

describe('Checkbox — uncontrolled', () => {
  it('defaults to unchecked', () => {
    render(<Dark><Checkbox label="test" /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('respects defaultChecked', () => {
    render(<Dark><Checkbox label="test" defaultChecked /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles on click', () => {
    render(<Dark><Checkbox label="test" /></Dark>);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange on click', () => {
    const onChange = vi.fn();
    render(<Dark><Checkbox label="test" onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// Controlled
// ---------------------------------------------------------------------------

describe('Checkbox — controlled', () => {
  it('reflects controlled checked state', () => {
    const { rerender } = render(<Dark><Checkbox label="test" checked={false} /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    rerender(<Dark><Checkbox label="test" checked={true} /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with new value', () => {
    const onChange = vi.fn();
    render(<Dark><Checkbox label="test" checked={false} onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// Indeterminate
// ---------------------------------------------------------------------------

describe('Checkbox — indeterminate', () => {
  it('sets aria-checked to mixed when indeterminate', () => {
    render(<Dark><Checkbox label="test" indeterminate /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('shows indeterminate even when checked is false', () => {
    render(<Dark><Checkbox label="test" indeterminate checked={false} /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Checkbox — disabled', () => {
  it('sets aria-disabled', () => {
    render(<Dark><Checkbox label="test" disabled /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-disabled', 'true');
  });

  it('prevents toggling when disabled', () => {
    const onChange = vi.fn();
    render(<Dark><Checkbox label="test" disabled onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('Checkbox — error', () => {
  it('sets aria-invalid when error', () => {
    render(<Dark><Checkbox label="test" error /></Dark>);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when no error', () => {
    render(<Dark><Checkbox label="test" /></Dark>);
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-invalid');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Checkbox — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Checkbox label="test" size={size} /></Dark>);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Checkbox — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><Checkbox label="test" skeleton /></Dark>);
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render checkbox element when skeleton', () => {
    render(<Dark><Checkbox label="test" skeleton /></Dark>);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast — checked box + icon
// ---------------------------------------------------------------------------

describe('Checkbox — WCAG contrast', () => {
  const isHex = (s: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);

  describe('dark mode', () => {
    it('checked icon on box passes AA-large (3:1)', () => {
      const colors = resolveCheckboxColors(true, false, false, false, false, darkTheme);
      if (!isHex(colors.iconColor) || !isHex(colors.boxBg)) return;
      const ratio = contrastRatio(colors.iconColor, colors.boxBg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('indeterminate icon on box passes AA-large (3:1)', () => {
      const colors = resolveCheckboxColors(false, true, false, false, false, darkTheme);
      if (!isHex(colors.iconColor) || !isHex(colors.boxBg)) return;
      const ratio = contrastRatio(colors.iconColor, colors.boxBg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('light mode', () => {
    it('checked icon on box passes AA-large (3:1)', () => {
      const colors = resolveCheckboxColors(true, false, false, false, false, lightTheme);
      if (!isHex(colors.iconColor) || !isHex(colors.boxBg)) return;
      const ratio = contrastRatio(colors.iconColor, colors.boxBg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('indeterminate icon on box passes AA-large (3:1)', () => {
      const colors = resolveCheckboxColors(false, true, false, false, false, lightTheme);
      if (!isHex(colors.iconColor) || !isHex(colors.boxBg)) return;
      const ratio = contrastRatio(colors.iconColor, colors.boxBg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
});
