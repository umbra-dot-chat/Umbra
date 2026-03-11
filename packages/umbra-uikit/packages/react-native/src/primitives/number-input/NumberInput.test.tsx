/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NumberInput } from './NumberInput';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('NumberInput — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <NumberInput testID="number-input" />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <NumberInput label="Quantity" />
      </Wrapper>,
    );
    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    render(
      <Wrapper>
        <NumberInput hint="Enter a number between 1 and 10" />
      </Wrapper>,
    );
    expect(screen.getByText('Enter a number between 1 and 10')).toBeInTheDocument();
  });

  it('renders error message when error is a string', () => {
    render(
      <Wrapper>
        <NumberInput error="Value is required" />
      </Wrapper>,
    );
    expect(screen.getByText('Value is required')).toBeInTheDocument();
  });

  it('renders increment and decrement buttons', () => {
    render(
      <Wrapper>
        <NumberInput />
      </Wrapper>,
    );
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(NumberInput.displayName).toBe('NumberInput');
  });
});

// ---------------------------------------------------------------------------
// Default value
// ---------------------------------------------------------------------------

describe('NumberInput — default value', () => {
  it('displays 0 by default', () => {
    render(
      <Wrapper>
        <NumberInput testID="number-input" />
      </Wrapper>,
    );
    const input = screen.getByTestId('number-input');
    // The root is a View; the TextInput is nested within it
    // react-native-web renders TextInput with value as the input's value attribute
    const textInput = input.querySelector('input') as HTMLInputElement;
    expect(textInput.value).toBe('0');
  });

  it('displays the provided defaultValue', () => {
    render(
      <Wrapper>
        <NumberInput testID="number-input" defaultValue={5} />
      </Wrapper>,
    );
    const input = screen.getByTestId('number-input');
    const textInput = input.querySelector('input') as HTMLInputElement;
    expect(textInput.value).toBe('5');
  });

  it('displays the controlled value', () => {
    render(
      <Wrapper>
        <NumberInput testID="number-input" value={42} />
      </Wrapper>,
    );
    const input = screen.getByTestId('number-input');
    const textInput = input.querySelector('input') as HTMLInputElement;
    expect(textInput.value).toBe('42');
  });
});

// ---------------------------------------------------------------------------
// Min / max props
// ---------------------------------------------------------------------------

describe('NumberInput — min/max', () => {
  it('disables the decrement button when at min', () => {
    render(
      <Wrapper>
        <NumberInput value={0} min={0} />
      </Wrapper>,
    );
    const decrementBtn = screen.getByText('-').closest('[role="button"]') as HTMLElement;
    expect(decrementBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables the increment button when at max', () => {
    render(
      <Wrapper>
        <NumberInput value={10} max={10} />
      </Wrapper>,
    );
    const incrementBtn = screen.getByText('+').closest('[role="button"]') as HTMLElement;
    expect(incrementBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables both buttons when value is between min and max', () => {
    render(
      <Wrapper>
        <NumberInput value={5} min={0} max={10} />
      </Wrapper>,
    );
    const decrementBtn = screen.getByText('-').closest('[role="button"]') as HTMLElement;
    const incrementBtn = screen.getByText('+').closest('[role="button"]') as HTMLElement;
    expect(decrementBtn).not.toHaveAttribute('aria-disabled', 'true');
    expect(incrementBtn).not.toHaveAttribute('aria-disabled', 'true');
  });
});

// ---------------------------------------------------------------------------
// onChange callback
// ---------------------------------------------------------------------------

describe('NumberInput — onChange', () => {
  it('calls onChange when increment button is pressed', () => {
    const handleChange = vi.fn();
    render(
      <Wrapper>
        <NumberInput defaultValue={5} step={1} onChange={handleChange} />
      </Wrapper>,
    );
    const incrementBtn = screen.getByText('+').closest('[role="button"]') as HTMLElement;
    // NumberInput uses onPressIn for hold-to-repeat, which maps to pointerdown in web
    fireEvent.pointerDown(incrementBtn);
    fireEvent.pointerUp(incrementBtn);
    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it('calls onChange when decrement button is pressed', () => {
    const handleChange = vi.fn();
    render(
      <Wrapper>
        <NumberInput defaultValue={5} step={1} onChange={handleChange} />
      </Wrapper>,
    );
    const decrementBtn = screen.getByText('-').closest('[role="button"]') as HTMLElement;
    fireEvent.pointerDown(decrementBtn);
    fireEvent.pointerUp(decrementBtn);
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('clamps onChange value to min', () => {
    const handleChange = vi.fn();
    render(
      <Wrapper>
        <NumberInput defaultValue={0} min={0} step={1} onChange={handleChange} />
      </Wrapper>,
    );
    const decrementBtn = screen.getByText('-').closest('[role="button"]') as HTMLElement;
    fireEvent.pointerDown(decrementBtn);
    fireEvent.pointerUp(decrementBtn);
    // Should not call onChange because the button is disabled at min
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('clamps onChange value to max', () => {
    const handleChange = vi.fn();
    render(
      <Wrapper>
        <NumberInput defaultValue={10} max={10} step={1} onChange={handleChange} />
      </Wrapper>,
    );
    const incrementBtn = screen.getByText('+').closest('[role="button"]') as HTMLElement;
    fireEvent.pointerDown(incrementBtn);
    fireEvent.pointerUp(incrementBtn);
    // Should not call onChange because the button is disabled at max
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('respects custom step value', () => {
    const handleChange = vi.fn();
    render(
      <Wrapper>
        <NumberInput defaultValue={10} step={5} onChange={handleChange} />
      </Wrapper>,
    );
    const incrementBtn = screen.getByText('+').closest('[role="button"]') as HTMLElement;
    fireEvent.pointerDown(incrementBtn);
    fireEvent.pointerUp(incrementBtn);
    expect(handleChange).toHaveBeenCalledWith(15);
  });

  it('is disabled when disabled prop is true', () => {
    const handleChange = vi.fn();
    render(
      <Wrapper>
        <NumberInput testID="number-input" defaultValue={5} disabled onChange={handleChange} />
      </Wrapper>,
    );
    const root = screen.getByTestId('number-input');
    const textInput = root.querySelector('input') as HTMLInputElement;
    expect(textInput).toHaveAttribute('disabled');
  });
});
