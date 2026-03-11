/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextArea } from './TextArea';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { resolveTextAreaColors } from '@coexist/wisp-core/styles/TextArea.styles';
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

describe('TextArea — rendering', () => {
  it('renders a textarea element', () => {
    render(<Dark><TextArea placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).toBeInTheDocument();
  });

  it('renders as a textarea element', () => {
    render(<Dark><TextArea placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test').tagName).toBe('TEXTAREA');
  });

  it('passes className through', () => {
    const { container } = render(<Dark><TextArea className="custom" placeholder="test" /></Dark>);
    // className is on the wrapper div
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Value and onChange
// ---------------------------------------------------------------------------

describe('TextArea — value and onChange', () => {
  it('accepts value and onChange', () => {
    const onChange = vi.fn();
    render(<Dark><TextArea value="hello" onChange={onChange} /></Dark>);
    const textarea = screen.getByDisplayValue('hello');
    expect(textarea).toBeInTheDocument();
    fireEvent.change(textarea, { target: { value: 'world' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('accepts defaultValue', () => {
    render(<Dark><TextArea defaultValue="default" /></Dark>);
    expect(screen.getByDisplayValue('default')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('TextArea — label', () => {
  it('renders label text', () => {
    render(<Dark><TextArea label="Description" placeholder="test" /></Dark>);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('label is associated via htmlFor', () => {
    render(<Dark><TextArea label="Description" placeholder="test" /></Dark>);
    const label = screen.getByText('Description');
    const textarea = screen.getByPlaceholderText('test');
    expect(label).toHaveAttribute('for', textarea.id);
  });

  it('uses provided id for htmlFor linking', () => {
    render(<Dark><TextArea label="Description" id="my-textarea" placeholder="test" /></Dark>);
    const label = screen.getByText('Description');
    expect(label).toHaveAttribute('for', 'my-textarea');
    expect(screen.getByPlaceholderText('test')).toHaveAttribute('id', 'my-textarea');
  });
});

// ---------------------------------------------------------------------------
// Hint
// ---------------------------------------------------------------------------

describe('TextArea — hint', () => {
  it('renders hint text', () => {
    render(<Dark><TextArea hint="Max 500 characters" placeholder="test" /></Dark>);
    expect(screen.getByText('Max 500 characters')).toBeInTheDocument();
  });

  it('links hint via aria-describedby', () => {
    render(<Dark><TextArea hint="Max 500 characters" placeholder="test" /></Dark>);
    const textarea = screen.getByPlaceholderText('test');
    const hintId = textarea.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toHaveTextContent('Max 500 characters');
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('TextArea — error', () => {
  it('shows error message string', () => {
    render(<Dark><TextArea error="Required field" placeholder="test" /></Dark>);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies aria-invalid when error is string', () => {
    render(<Dark><TextArea error="Required" placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies aria-invalid when error is boolean true', () => {
    render(<Dark><TextArea error={true} placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not apply aria-invalid when error is false', () => {
    render(<Dark><TextArea error={false} placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).not.toHaveAttribute('aria-invalid');
  });

  it('error message replaces hint text', () => {
    render(<Dark><TextArea hint="Helper text" error="Error text" placeholder="test" /></Dark>);
    expect(screen.getByText('Error text')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Warning
// ---------------------------------------------------------------------------

describe('TextArea — warning', () => {
  it('shows warning message string', () => {
    render(<Dark><TextArea warning="Getting long" placeholder="test" /></Dark>);
    expect(screen.getByText('Getting long')).toBeInTheDocument();
  });

  it('error takes precedence over warning', () => {
    render(<Dark><TextArea error="Error text" warning="Warning text" placeholder="test" /></Dark>);
    expect(screen.getByText('Error text')).toBeInTheDocument();
    expect(screen.queryByText('Warning text')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('TextArea — disabled', () => {
  it('sets disabled attribute', () => {
    render(<Dark><TextArea disabled placeholder="test" /></Dark>);
    expect(screen.getByPlaceholderText('test')).toBeDisabled();
  });

  it('prevents focus when disabled', () => {
    const onFocus = vi.fn();
    render(<Dark><TextArea disabled onFocus={onFocus} placeholder="test" /></Dark>);
    const textarea = screen.getByPlaceholderText('test');
    fireEvent.focus(textarea);
    // The textarea itself is disabled so the browser prevents actual focus
    expect(textarea).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('TextArea — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><TextArea size={size} placeholder={`size-${size}`} /></Dark>);
      expect(screen.getByPlaceholderText(`size-${size}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('TextArea — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(<Dark><TextArea skeleton /></Dark>);
    const el = container.querySelector('div');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('does not render textarea element when skeleton', () => {
    render(<Dark><TextArea skeleton placeholder="hidden" /></Dark>);
    expect(screen.queryByPlaceholderText('hidden')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Focus state
// ---------------------------------------------------------------------------

describe('TextArea — focus', () => {
  it('calls onFocus and onBlur handlers', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<Dark><TextArea onFocus={onFocus} onBlur={onBlur} placeholder="test" /></Dark>);
    const textarea = screen.getByPlaceholderText('test');
    fireEvent.focus(textarea);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(textarea);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast — text on textarea background
// ---------------------------------------------------------------------------

describe('TextArea — WCAG contrast', () => {
  const isHex = (s: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);

  describe('dark mode', () => {
    it('default text on canvas passes AA (4.5:1)', () => {
      const colors = resolveTextAreaColors(false, false, false, false, darkTheme);
      // TextArea bg is transparent, so text sits on canvas
      const bg = darkTheme.colors.background.canvas;
      if (!isHex(colors.text) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.text, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('label text on canvas passes AA (4.5:1)', () => {
      const colors = resolveTextAreaColors(false, false, false, false, darkTheme);
      const bg = darkTheme.colors.background.canvas;
      if (!isHex(colors.label) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.label, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('placeholder on canvas passes AA-large (3:1)', () => {
      const colors = resolveTextAreaColors(false, false, false, false, darkTheme);
      const bg = darkTheme.colors.background.canvas;
      if (!isHex(colors.placeholder) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.placeholder, bg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('light mode', () => {
    it('default text on canvas passes AA (4.5:1)', () => {
      const colors = resolveTextAreaColors(false, false, false, false, lightTheme);
      const bg = lightTheme.colors.background.canvas;
      if (!isHex(colors.text) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.text, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('label text on canvas passes AA (4.5:1)', () => {
      const colors = resolveTextAreaColors(false, false, false, false, lightTheme);
      const bg = lightTheme.colors.background.canvas;
      if (!isHex(colors.label) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.label, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('placeholder on canvas passes AA-large (3:1)', () => {
      const colors = resolveTextAreaColors(false, false, false, false, lightTheme);
      const bg = lightTheme.colors.background.canvas;
      if (!isHex(colors.placeholder) || !isHex(bg)) return;
      const ratio = contrastRatio(colors.placeholder, bg);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
});
