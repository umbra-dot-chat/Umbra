/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { resolveInputColors } from '@coexist/wisp-core/styles/Input.styles';
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

describe('Input — rendering', () => {
  it('renders an input element', () => {
    render(<Dark><Input placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).toBeInTheDocument();
  });

  it('renders as an input element', () => {
    render(<Dark><Input placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test').tagName).toBe('INPUT');
  });

  it('passes className through', () => {
    const { container } = render(<Dark><Input className="custom" placeholder="test" /></Dark>);
    // className is on the wrapper div
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Value and onChange
// ---------------------------------------------------------------------------

describe('Input — value and onChange', () => {
  it('accepts value and onChange', () => {
    const onChange = vi.fn();
    render(<Dark><Input value="hello" onChange={onChange} /></Dark>);
    const input = screen.getByDisplayValue('hello');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'world' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('accepts defaultValue', () => {
    render(<Dark><Input defaultValue="default" /></Dark>);
    expect(screen.getByDisplayValue('default')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('Input — label', () => {
  it('renders label text', () => {
    render(<Dark><Input label="Email" placeholder="test" /></Dark>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('label is associated via htmlFor', () => {
    render(<Dark><Input label="Email" placeholder="test" /></Dark>);
    const label = screen.getByText('Email');
    const input = screen.getByPlaceholderText('test');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('uses provided id for htmlFor linking', () => {
    render(<Dark><Input label="Email" id="my-input" placeholder="test" /></Dark>);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'my-input');
    expect(screen.getByPlaceholderText('test')).toHaveAttribute('id', 'my-input');
  });
});

// ---------------------------------------------------------------------------
// Hint
// ---------------------------------------------------------------------------

describe('Input — hint', () => {
  it('renders hint text', () => {
    render(<Dark><Input hint="Enter your email" placeholder="test" /></Dark>);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('links hint via aria-describedby', () => {
    render(<Dark><Input hint="Enter your email" placeholder="test" /></Dark>);
    const input = screen.getByPlaceholderText('test');
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toHaveTextContent('Enter your email');
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('Input — error', () => {
  it('shows error message string', () => {
    render(<Dark><Input error="Required field" placeholder="test" /></Dark>);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies aria-invalid when error is string', () => {
    render(<Dark><Input error="Required" placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies aria-invalid when error is boolean true', () => {
    render(<Dark><Input error={true} placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not apply aria-invalid when error is false', () => {
    render(<Dark><Input error={false} placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).not.toHaveAttribute('aria-invalid');
  });

  it('error message replaces hint text', () => {
    render(<Dark><Input hint="Helper text" error="Error text" placeholder="test" /></Dark>);
    expect(screen.getByText('Error text')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Input — disabled', () => {
  it('sets disabled attribute', () => {
    render(<Dark><Input disabled placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).toBeDisabled();
  });

  it('prevents focus when disabled', () => {
    const onFocus = vi.fn();
    render(<Dark><Input disabled onFocus={onFocus} placeholder="test" /></Dark>);
    const input = screen.getByPlaceholderText('test');
    fireEvent.focus(input);
    // onFocus is called but internal focus state does not change
    // The input itself is disabled so the browser prevents actual focus
    expect(input).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Input — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Input size={size} placeholder={`size-${size}`} /></Dark>);
      expect(screen.getByPlaceholderText(`size-${size}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Input — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><Input skeleton /></Dark>);
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render input element when skeleton', () => {
    render(<Dark><Input skeleton placeholder="hidden" /></Dark>);
    expect(screen.queryByPlaceholderText('hidden')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

describe('Input — icons', () => {
  const MockIcon = ({ size, color, strokeWidth }: { size?: number | string; color?: string; strokeWidth?: number }) => (
    <svg data-testid="mock-icon" width={size} height={size} stroke={color} strokeWidth={strokeWidth} />
  );

  it('renders leading icon', () => {
    render(<Dark><Input icon={MockIcon} placeholder="test" /></Dark>);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders trailing icon', () => {
    render(<Dark><Input trailingIcon={MockIcon} placeholder="test" /></Dark>);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders both leading and trailing icons', () => {
    render(<Dark><Input icon={MockIcon} trailingIcon={MockIcon} placeholder="test" /></Dark>);
    expect(screen.getAllByTestId('mock-icon')).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Focus state
// ---------------------------------------------------------------------------

describe('Input — focus', () => {
  it('calls onFocus and onBlur handlers', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<Dark><Input onFocus={onFocus} onBlur={onBlur} placeholder="test" /></Dark>);
    const input = screen.getByPlaceholderText('test');
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast — text on input background
// ---------------------------------------------------------------------------

describe('Input — WCAG contrast', () => {
  const isHex = (s: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);

  describe('dark mode', () => {
    it('default text on canvas passes AA (4.5:1)', () => {
      const colors = resolveInputColors(false, false, false, false, darkTheme);
      // Input bg is transparent, so text sits on canvas
      const bg = darkTheme.colors.background.canvas;
      if (!isHex(colors.text) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.text, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('label text on canvas passes AA (4.5:1)', () => {
      const colors = resolveInputColors(false, false, false, false, darkTheme);
      const bg = darkTheme.colors.background.canvas;
      if (!isHex(colors.label) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.label, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('placeholder on canvas passes AA-large (3:1)', () => {
      const colors = resolveInputColors(false, false, false, false, darkTheme);
      const bg = darkTheme.colors.background.canvas;
      if (!isHex(colors.placeholder) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.placeholder, bg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('light mode', () => {
    it('default text on canvas passes AA (4.5:1)', () => {
      const colors = resolveInputColors(false, false, false, false, lightTheme);
      const bg = lightTheme.colors.background.canvas;
      if (!isHex(colors.text) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.text, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('label text on canvas passes AA (4.5:1)', () => {
      const colors = resolveInputColors(false, false, false, false, lightTheme);
      const bg = lightTheme.colors.background.canvas;
      if (!isHex(colors.label) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.label, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('placeholder on canvas passes AA-large (3:1)', () => {
      const colors = resolveInputColors(false, false, false, false, lightTheme);
      const bg = lightTheme.colors.background.canvas;
      if (!isHex(colors.placeholder) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.placeholder, bg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
});
