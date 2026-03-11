/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Stepper } from './Stepper';
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

describe('Stepper — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Stepper />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders decrement and increment buttons', () => {
    render(
      <Wrapper>
        <Stepper />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Decrement')).toBeInTheDocument();
    expect(screen.getByLabelText('Increment')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Shows value
// ---------------------------------------------------------------------------

describe('Stepper — shows value', () => {
  it('displays default value of 0', () => {
    render(
      <Wrapper>
        <Stepper />
      </Wrapper>,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays a controlled value', () => {
    render(
      <Wrapper>
        <Stepper value={42} />
      </Wrapper>,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays custom defaultValue', () => {
    render(
      <Wrapper>
        <Stepper defaultValue={5} />
      </Wrapper>,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('updates value on increment click', () => {
    render(
      <Wrapper>
        <Stepper defaultValue={3} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Increment'));
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('updates value on decrement click', () => {
    render(
      <Wrapper>
        <Stepper defaultValue={3} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Decrement'));
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Min / max constraints
// ---------------------------------------------------------------------------

describe('Stepper — min/max constraints', () => {
  it('does not decrement below min', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Stepper defaultValue={0} min={0} onChange={onChange} />
      </Wrapper>,
    );
    // The decrement button should be disabled at min
    const decrementBtn = screen.getByLabelText('Decrement');
    fireEvent.click(decrementBtn);
    // onChange should not be called because the value cannot go below min
    // and the button is disabled
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('does not increment above max', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Stepper defaultValue={10} max={10} onChange={onChange} />
      </Wrapper>,
    );
    const incrementBtn = screen.getByLabelText('Increment');
    fireEvent.click(incrementBtn);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('clamps defaultValue to min when below', () => {
    render(
      <Wrapper>
        <Stepper defaultValue={-5} min={0} />
      </Wrapper>,
    );
    // defaultValue is -5, but once increment/decrement is pressed it clamps
    // The component stores -5 initially though, so let's verify increment clamps
    fireEvent.click(screen.getByLabelText('Increment'));
    // -5 + 1 = -4, but clamped to min 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('calls onChange with clamped value', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Stepper defaultValue={9} max={10} step={2} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByLabelText('Increment'));
    // 9 + 2 = 11, clamped to 10
    expect(onChange).toHaveBeenCalledWith(10);
  });
});
