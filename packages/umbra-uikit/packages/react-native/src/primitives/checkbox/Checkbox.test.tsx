/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './Checkbox';
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

describe('Checkbox — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Checkbox />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <Checkbox label="Accept terms" />
      </Wrapper>,
    );
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('renders with a description', () => {
    render(
      <Wrapper>
        <Checkbox label="Newsletter" description="Receive weekly updates" />
      </Wrapper>,
    );
    expect(screen.getByText('Receive weekly updates')).toBeInTheDocument();
  });

  it('sets aria-label from the label prop', () => {
    const { container } = render(
      <Wrapper>
        <Checkbox label="Dark mode" />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[aria-label="Dark mode"]');
    expect(checkbox).toBeTruthy();
  });

  it('has correct displayName', () => {
    expect(Checkbox.displayName).toBe('Checkbox');
  });
});

// ---------------------------------------------------------------------------
// Checked state
// ---------------------------------------------------------------------------

describe('Checkbox — checked state', () => {
  it('is unchecked by default — clicking yields true', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <Checkbox onChange={onChange} />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]')!;
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('respects defaultChecked=true — clicking yields false', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <Checkbox defaultChecked onChange={onChange} />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]')!;
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('respects controlled checked=true — clicking yields false', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <Checkbox checked onChange={onChange} />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]')!;
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('respects controlled checked=false — clicking yields true', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <Checkbox checked={false} onChange={onChange} />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]')!;
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders indeterminate with role checkbox', () => {
    const { container } = render(
      <Wrapper>
        <Checkbox indeterminate />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// onChange callback
// ---------------------------------------------------------------------------

describe('Checkbox — onChange callback', () => {
  it('calls onChange with true when toggling from unchecked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <Checkbox onChange={handleChange} />
      </Wrapper>,
    );
    fireEvent.click(container.querySelector('[role="checkbox"]')!);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when toggling from checked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <Checkbox checked onChange={handleChange} />
      </Wrapper>,
    );
    fireEvent.click(container.querySelector('[role="checkbox"]')!);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('toggles internal state in uncontrolled mode', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <Checkbox onChange={handleChange} />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]')!;
    // Click to check
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenLastCalledWith(true);
    // Click to uncheck
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenLastCalledWith(false);
    expect(handleChange).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('Checkbox — disabled', () => {
  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <Checkbox disabled onChange={handleChange} />
      </Wrapper>,
    );
    fireEvent.click(container.querySelector('[role="checkbox"]')!);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('has aria-disabled when disabled', () => {
    const { container } = render(
      <Wrapper>
        <Checkbox disabled />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies reduced opacity when disabled', () => {
    const { container } = render(
      <Wrapper>
        <Checkbox disabled />
      </Wrapper>,
    );
    const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement;
    expect(checkbox.style.opacity).toBe('0.5');
  });
});
