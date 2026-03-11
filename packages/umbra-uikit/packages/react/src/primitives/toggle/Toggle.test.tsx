/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toggle } from './Toggle';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { resolveToggleColors } from '@coexist/wisp-core/styles/Toggle.styles';
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

describe('Toggle — rendering', () => {
  it('renders as a button with role="switch"', () => {
    render(<Dark><Toggle label="test" /></Dark>);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<Dark><Toggle label="test" /></Dark>);
    expect(screen.getByRole('switch').tagName).toBe('BUTTON');
  });

  it('defaults to type="button"', () => {
    render(<Dark><Toggle label="test" /></Dark>);
    expect(screen.getByRole('switch')).toHaveAttribute('type', 'button');
  });

  it('passes className through', () => {
    render(<Dark><Toggle label="test" className="custom" /></Dark>);
    expect(screen.getByRole('switch')).toHaveClass('custom');
  });

  it('sets aria-label from label prop', () => {
    render(<Dark><Toggle label="Toggle dark mode" /></Dark>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Toggle dark mode');
  });
});

// ---------------------------------------------------------------------------
// Uncontrolled
// ---------------------------------------------------------------------------

describe('Toggle — uncontrolled', () => {
  it('defaults to unchecked', () => {
    render(<Dark><Toggle label="test" /></Dark>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('respects defaultChecked', () => {
    render(<Dark><Toggle label="test" defaultChecked /></Dark>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles on click', () => {
    render(<Dark><Toggle label="test" /></Dark>);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange on click', () => {
    const onChange = vi.fn();
    render(<Dark><Toggle label="test" onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// Controlled
// ---------------------------------------------------------------------------

describe('Toggle — controlled', () => {
  it('reflects controlled checked state', () => {
    const { rerender } = render(<Dark><Toggle label="test" checked={false} /></Dark>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    rerender(<Dark><Toggle label="test" checked={true} /></Dark>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with new value', () => {
    const onChange = vi.fn();
    render(<Dark><Toggle label="test" checked={false} onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Toggle — disabled', () => {
  it('sets disabled attribute', () => {
    render(<Dark><Toggle label="test" disabled /></Dark>);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('prevents toggling when disabled', () => {
    const onChange = vi.fn();
    render(<Dark><Toggle label="test" disabled onChange={onChange} /></Dark>);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Toggle — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Toggle label="test" size={size} /></Dark>);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  sizes.forEach((size) => {
    it(`renders slim size="${size}" without crashing`, () => {
      render(<Dark><Toggle label="test" size={size} slim /></Dark>);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Toggle — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><Toggle label="test" skeleton /></Dark>);
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render switch element when skeleton', () => {
    render(<Dark><Toggle label="test" skeleton /></Dark>);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast — handle on track
// ---------------------------------------------------------------------------

describe('Toggle — WCAG contrast', () => {
  const isHex = (s: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);

  describe('dark mode', () => {
    it('checked handle on track passes AA-large (3:1)', () => {
      const colors = resolveToggleColors(true, darkTheme);
      if (!isHex(colors.handleBg) || !isHex(colors.trackBg)) return;
      const ratio = contrastRatio(colors.handleBg, colors.trackBg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('unchecked handle on track passes AA-large (3:1)', () => {
      const colors = resolveToggleColors(false, darkTheme);
      if (!isHex(colors.handleBg) || !isHex(colors.trackBg)) return;
      const ratio = contrastRatio(colors.handleBg, colors.trackBg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('light mode', () => {
    it('checked handle on track passes AA-large (3:1)', () => {
      const colors = resolveToggleColors(true, lightTheme);
      if (!isHex(colors.handleBg) || !isHex(colors.trackBg)) return;
      const ratio = contrastRatio(colors.handleBg, colors.trackBg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });

    it('unchecked handle on track passes AA-large (3:1)', () => {
      const colors = resolveToggleColors(false, lightTheme);
      if (!isHex(colors.handleBg) || !isHex(colors.trackBg)) return;
      const ratio = contrastRatio(colors.handleBg, colors.trackBg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
});
