/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CheckboxGroup } from './CheckboxGroup';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('CheckboxGroup — rendering', () => {
  it('renders all option labels', () => {
    render(
      <Wrapper>
        <CheckboxGroup options={defaultOptions} />
      </Wrapper>,
    );
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Cherry')).toBeInTheDocument();
  });

  it('renders group label when provided', () => {
    render(
      <Wrapper>
        <CheckboxGroup label="Fruits" options={defaultOptions} />
      </Wrapper>,
    );
    expect(screen.getByText('Fruits')).toBeInTheDocument();
  });

  it('renders group description when provided', () => {
    render(
      <Wrapper>
        <CheckboxGroup
          label="Fruits"
          description="Pick your favorites"
          options={defaultOptions}
        />
      </Wrapper>,
    );
    expect(screen.getByText('Pick your favorites')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(
      <Wrapper>
        <CheckboxGroup options={defaultOptions} error="Select at least one" />
      </Wrapper>,
    );
    expect(screen.getByText('Select at least one')).toBeInTheDocument();
  });

  it('has correct displayName', () => {
    expect(CheckboxGroup.displayName).toBe('CheckboxGroup');
  });
});

// ---------------------------------------------------------------------------
// onChange callback
// ---------------------------------------------------------------------------

describe('CheckboxGroup — onChange', () => {
  it('calls onChange with the value added when selecting', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <CheckboxGroup options={defaultOptions} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Apple'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['apple']);
  });

  it('calls onChange with the value removed when deselecting', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <CheckboxGroup
          options={defaultOptions}
          defaultValue={['apple', 'banana']}
          onChange={onChange}
        />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Apple'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['banana']);
  });

  it('accumulates multiple selections in uncontrolled mode', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <CheckboxGroup options={defaultOptions} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Apple'));
    fireEvent.click(screen.getByText('Cherry'));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'cherry']);
  });

  it('supports controlled value', () => {
    render(
      <Wrapper>
        <CheckboxGroup options={defaultOptions} value={['banana']} />
      </Wrapper>,
    );
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });
});
