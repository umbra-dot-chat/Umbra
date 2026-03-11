/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NumberInput } from './NumberInput';
import { numberInputSizes } from '@coexist/wisp-core/types/NumberInput.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('NumberInput — rendering', () => {
  it('renders a spinbutton element', () => {
    render(<Dark><NumberInput /></Dark>);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('renders increment and decrement buttons', () => {
    render(<Dark><NumberInput /></Dark>);
    expect(screen.getByLabelText('Increment')).toBeInTheDocument();
    expect(screen.getByLabelText('Decrement')).toBeInTheDocument();
  });

  it('renders default value of 0', () => {
    render(<Dark><NumberInput /></Dark>);
    expect(screen.getByRole('spinbutton')).toHaveValue('0');
  });

  it('renders with placeholder', () => {
    render(<Dark><NumberInput placeholder="Qty" /></Dark>);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Controlled vs Uncontrolled
// ---------------------------------------------------------------------------

describe('NumberInput — controlled / uncontrolled', () => {
  it('displays controlled value', () => {
    render(<Dark><NumberInput value={42} /></Dark>);
    expect(screen.getByRole('spinbutton')).toHaveValue('42');
  });

  it('displays defaultValue for uncontrolled mode', () => {
    render(<Dark><NumberInput defaultValue={7} /></Dark>);
    expect(screen.getByRole('spinbutton')).toHaveValue('7');
  });

  it('calls onChange with new value on increment', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={5} onChange={onChange} /></Dark>);
    fireEvent.mouseDown(screen.getByLabelText('Increment'));
    fireEvent.mouseUp(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('calls onChange with new value on decrement', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={5} onChange={onChange} /></Dark>);
    fireEvent.mouseDown(screen.getByLabelText('Decrement'));
    fireEvent.mouseUp(screen.getByLabelText('Decrement'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

// ---------------------------------------------------------------------------
// Min / Max clamping
// ---------------------------------------------------------------------------

describe('NumberInput — min/max clamping', () => {
  it('clamps value to min on decrement', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={1} min={0} step={5} onChange={onChange} /></Dark>);
    fireEvent.mouseDown(screen.getByLabelText('Decrement'));
    fireEvent.mouseUp(screen.getByLabelText('Decrement'));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('clamps value to max on increment', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={8} max={10} step={5} onChange={onChange} /></Dark>);
    fireEvent.mouseDown(screen.getByLabelText('Increment'));
    fireEvent.mouseUp(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('disables decrement button when value is at min', () => {
    render(<Dark><NumberInput value={0} min={0} /></Dark>);
    expect(screen.getByLabelText('Decrement')).toBeDisabled();
  });

  it('disables increment button when value is at max', () => {
    render(<Dark><NumberInput value={10} max={10} /></Dark>);
    expect(screen.getByLabelText('Increment')).toBeDisabled();
  });

  it('sets aria-valuemin and aria-valuemax', () => {
    render(<Dark><NumberInput value={5} min={0} max={10} /></Dark>);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
  });
});

// ---------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------

describe('NumberInput — step', () => {
  it('increments by custom step', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={0} step={5} onChange={onChange} /></Dark>);
    fireEvent.mouseDown(screen.getByLabelText('Increment'));
    fireEvent.mouseUp(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('decrements by custom step', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={10} step={3} onChange={onChange} /></Dark>);
    fireEvent.mouseDown(screen.getByLabelText('Decrement'));
    fireEvent.mouseUp(screen.getByLabelText('Decrement'));
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('handles decimal step without floating-point drift', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={0} step={0.1} onChange={onChange} /></Dark>);
    fireEvent.mouseDown(screen.getByLabelText('Increment'));
    fireEvent.mouseUp(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith(0.1);
  });
});

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

describe('NumberInput — keyboard', () => {
  it('increments on ArrowUp', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={5} onChange={onChange} /></Dark>);
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('decrements on ArrowDown', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={5} onChange={onChange} /></Dark>);
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not respond to keyboard when disabled', () => {
    const onChange = vi.fn();
    render(<Dark><NumberInput value={5} onChange={onChange} disabled /></Dark>);
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'ArrowUp' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('NumberInput — label', () => {
  it('renders label text', () => {
    render(<Dark><NumberInput label="Quantity" /></Dark>);
    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  it('label is associated via htmlFor', () => {
    render(<Dark><NumberInput label="Quantity" /></Dark>);
    const label = screen.getByText('Quantity');
    const input = screen.getByRole('spinbutton');
    expect(label).toHaveAttribute('for', input.id);
  });
});

// ---------------------------------------------------------------------------
// Hint
// ---------------------------------------------------------------------------

describe('NumberInput — hint', () => {
  it('renders hint text', () => {
    render(<Dark><NumberInput hint="Enter a number" /></Dark>);
    expect(screen.getByText('Enter a number')).toBeInTheDocument();
  });

  it('links hint via aria-describedby', () => {
    render(<Dark><NumberInput hint="Enter a number" /></Dark>);
    const input = screen.getByRole('spinbutton');
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toHaveTextContent('Enter a number');
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('NumberInput — error', () => {
  it('applies aria-invalid when error is true', () => {
    render(<Dark><NumberInput error /></Dark>);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not apply aria-invalid when error is false', () => {
    render(<Dark><NumberInput error={false} /></Dark>);
    expect(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-invalid');
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('NumberInput — disabled', () => {
  it('disables the input element', () => {
    render(<Dark><NumberInput disabled /></Dark>);
    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });

  it('disables both stepper buttons', () => {
    render(<Dark><NumberInput disabled /></Dark>);
    expect(screen.getByLabelText('Increment')).toBeDisabled();
    expect(screen.getByLabelText('Decrement')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('NumberInput — sizes', () => {
  numberInputSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><NumberInput size={size} /></Dark>);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className and style passthrough
// ---------------------------------------------------------------------------

describe('NumberInput — className and style', () => {
  it('passes className to wrapper div', () => {
    const { container } = render(<Dark><NumberInput className="custom" /></Dark>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('merges user style onto wrapper div', () => {
    const { container } = render(<Dark><NumberInput style={{ marginTop: 99 }} /></Dark>);
    expect((container.firstChild as HTMLElement).style.marginTop).toBe('99px');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('NumberInput — ref forwarding', () => {
  it('forwards ref to wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Dark><NumberInput ref={ref} /></Dark>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('NumberInput — accessibility', () => {
  it('has role="spinbutton"', () => {
    render(<Dark><NumberInput /></Dark>);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('sets aria-valuenow to current value', () => {
    render(<Dark><NumberInput value={42} /></Dark>);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '42');
  });

  it('sets inputMode="decimal"', () => {
    render(<Dark><NumberInput /></Dark>);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('inputMode', 'decimal');
  });

  it('stepper buttons have aria-label', () => {
    render(<Dark><NumberInput /></Dark>);
    expect(screen.getByLabelText('Increment')).toBeInTheDocument();
    expect(screen.getByLabelText('Decrement')).toBeInTheDocument();
  });
});
