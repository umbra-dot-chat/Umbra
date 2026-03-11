/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Radio, RadioGroup } from './Radio';
import { WispProvider } from '../../providers';
import { contrastRatio } from '@coexist/wisp-core/utils/contrast';
import { resolveRadioColors } from '@coexist/wisp-core/styles/Radio.styles';
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

describe('RadioGroup — rendering', () => {
  it('renders a div with role="radiogroup"', () => {
    render(
      <Dark>
        <RadioGroup>
          <Radio value="a" label="A" />
        </RadioGroup>
      </Dark>,
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('renders Radio children with role="radio"', () => {
    render(
      <Dark>
        <RadioGroup>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('renders label text', () => {
    render(
      <Dark>
        <RadioGroup>
          <Radio value="a" label="Option Alpha" />
        </RadioGroup>
      </Dark>,
    );
    expect(screen.getByText('Option Alpha')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <Dark>
        <RadioGroup>
          <Radio value="a" label="A" description="Some description" />
        </RadioGroup>
      </Dark>,
    );
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('passes className through to RadioGroup', () => {
    render(
      <Dark>
        <RadioGroup className="custom-group">
          <Radio value="a" label="A" />
        </RadioGroup>
      </Dark>,
    );
    expect(screen.getByRole('radiogroup')).toHaveClass('custom-group');
  });
});

// ---------------------------------------------------------------------------
// Selection behavior
// ---------------------------------------------------------------------------

describe('RadioGroup — selection', () => {
  it('selects a radio on click', () => {
    render(
      <Dark>
        <RadioGroup>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(radios[0]);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(radios[1]);
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when a radio is selected', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <RadioGroup onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

// ---------------------------------------------------------------------------
// Controlled mode
// ---------------------------------------------------------------------------

describe('RadioGroup — controlled', () => {
  it('reflects controlled value', () => {
    const { rerender } = render(
      <Dark>
        <RadioGroup value="a">
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');

    rerender(
      <Dark>
        <RadioGroup value="b">
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with new value', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <RadioGroup value="a" onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

// ---------------------------------------------------------------------------
// Uncontrolled mode
// ---------------------------------------------------------------------------

describe('RadioGroup — uncontrolled', () => {
  it('respects defaultValue', () => {
    render(
      <Dark>
        <RadioGroup defaultValue="b">
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('updates on click in uncontrolled mode', () => {
    render(
      <Dark>
        <RadioGroup defaultValue="a">
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('RadioGroup — disabled', () => {
  it('sets aria-disabled on all radios when group is disabled', () => {
    render(
      <Dark>
        <RadioGroup disabled>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('prevents selection when group is disabled', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <RadioGroup disabled onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('prevents selection on individually disabled radio', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <RadioGroup onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" disabled />
        </RadioGroup>
      </Dark>,
    );
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('RadioGroup — error', () => {
  it('sets aria-invalid on the radiogroup when error', () => {
    render(
      <Dark>
        <RadioGroup error>
          <Radio value="a" label="A" />
        </RadioGroup>
      </Dark>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when no error', () => {
    render(
      <Dark>
        <RadioGroup>
          <Radio value="a" label="A" />
        </RadioGroup>
      </Dark>,
    );
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-invalid');
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('RadioGroup — keyboard navigation', () => {
  it('selects with space key', () => {
    render(
      <Dark>
        <RadioGroup>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    fireEvent.keyUp(radios[0], { key: ' ' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('navigates with arrow keys', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <RadioGroup defaultValue="a" onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
          <Radio value="c" label="C" />
        </RadioGroup>
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('wraps around with arrow keys', () => {
    const onChange = vi.fn();
    render(
      <Dark>
        <RadioGroup defaultValue="c" onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
          <Radio value="c" label="C" />
        </RadioGroup>
      </Dark>,
    );
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[2], { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('RadioGroup — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <RadioGroup size={size}>
            <Radio value="a" label="A" />
          </RadioGroup>
        </Dark>,
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('RadioGroup — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <RadioGroup skeleton>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    const el = container.querySelector('div[aria-hidden]');
    expect(el).toBeInTheDocument();
  });

  it('does not render radio elements when skeleton', () => {
    render(
      <Dark>
        <RadioGroup skeleton>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Name attribute
// ---------------------------------------------------------------------------

describe('RadioGroup — name attribute', () => {
  it('passes name to hidden inputs', () => {
    const { container } = render(
      <Dark>
        <RadioGroup name="plan">
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Dark>,
    );
    const inputs = container.querySelectorAll('input[type="radio"]');
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('name', 'plan');
    });
  });
});

// ---------------------------------------------------------------------------
// WCAG contrast
// ---------------------------------------------------------------------------

describe('RadioGroup — WCAG contrast', () => {
  const isHex = (s: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);

  describe('dark mode', () => {
    it('label on canvas passes AA (4.5:1)', () => {
      const colors = resolveRadioColors(false, false, false, darkTheme);
      if (!isHex(colors.labelColor) || !isHex(darkTheme.colors.background.canvas)) return;
      const ratio = contrastRatio(colors.labelColor, darkTheme.colors.background.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('selected dot (accent) on canvas passes AA-large (3:1)', () => {
      const colors = resolveRadioColors(true, false, false, darkTheme);
      if (!isHex(colors.innerBg) || !isHex(darkTheme.colors.background.canvas)) return;
      const ratio = contrastRatio(colors.innerBg, darkTheme.colors.background.canvas);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('light mode', () => {
    it('label on canvas passes AA (4.5:1)', () => {
      const colors = resolveRadioColors(false, false, false, lightTheme);
      if (!isHex(colors.labelColor) || !isHex(lightTheme.colors.background.canvas)) return;
      const ratio = contrastRatio(colors.labelColor, lightTheme.colors.background.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('selected dot (accent) on canvas passes AA-large (3:1)', () => {
      const colors = resolveRadioColors(true, false, false, lightTheme);
      if (!isHex(colors.innerBg) || !isHex(lightTheme.colors.background.canvas)) return;
      const ratio = contrastRatio(colors.innerBg, lightTheme.colors.background.canvas);
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
});
