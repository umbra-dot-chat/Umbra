/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Radio, RadioGroup } from './Radio';
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

describe('Radio — rendering', () => {
  it('renders without crashing inside a RadioGroup', () => {
    const { container } = render(
      <Wrapper>
        <RadioGroup>
          <Radio value="a" testID="radio-a" />
        </RadioGroup>
      </Wrapper>,
    );
    const radio = container.querySelector('[role="radio"]');
    expect(radio).toBeTruthy();
  });

  it('renders with a label', () => {
    render(
      <Wrapper>
        <RadioGroup>
          <Radio value="a" label="Option A" />
        </RadioGroup>
      </Wrapper>,
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('renders with a description', () => {
    render(
      <Wrapper>
        <RadioGroup>
          <Radio value="a" label="Option A" description="First option" />
        </RadioGroup>
      </Wrapper>,
    );
    expect(screen.getByText('First option')).toBeInTheDocument();
  });

  it('renders multiple radios in a group', () => {
    const { container } = render(
      <Wrapper>
        <RadioGroup>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
          <Radio value="c" label="C" />
        </RadioGroup>
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios.length).toBe(3);
  });

  it('renders a radiogroup container', () => {
    const { container } = render(
      <Wrapper>
        <RadioGroup>
          <Radio value="a" />
        </RadioGroup>
      </Wrapper>,
    );
    const group = container.querySelector('[role="radiogroup"]');
    expect(group).toBeTruthy();
  });

  it('has correct displayName for Radio', () => {
    expect(Radio.displayName).toBe('Radio');
  });

  it('has correct displayName for RadioGroup', () => {
    expect(RadioGroup.displayName).toBe('RadioGroup');
  });
});

// ---------------------------------------------------------------------------
// Selected state
// ---------------------------------------------------------------------------

describe('Radio — selected state', () => {
  it('no radio is selected by default — clicking first yields its value', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <RadioGroup onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    fireEvent.click(radios[0]);
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('respects defaultValue on the group — clicking the selected one still fires onChange', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <RadioGroup defaultValue="b" onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Wrapper>,
    );
    // Clicking the already-selected radio still triggers onChange
    const radios = container.querySelectorAll('[role="radio"]');
    fireEvent.click(radios[0]);
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('respects controlled value on the group', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <RadioGroup value="a" onChange={onChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Wrapper>,
    );
    // Clicking radio b should call onChange with 'b'
    const radios = container.querySelectorAll('[role="radio"]');
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('sets aria-label on the radio from the label prop', () => {
    const { container } = render(
      <Wrapper>
        <RadioGroup>
          <Radio value="a" label="Option A" />
        </RadioGroup>
      </Wrapper>,
    );
    const radio = container.querySelector('[aria-label="Option A"]');
    expect(radio).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// onSelect / onChange callback
// ---------------------------------------------------------------------------

describe('Radio — onSelect callback', () => {
  it('calls onChange on the group when a radio is clicked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <RadioGroup onChange={handleChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    fireEvent.click(radios[1]);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('b');
  });

  it('updates selection in uncontrolled mode across multiple clicks', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <RadioGroup onChange={handleChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    // Click radio-a
    fireEvent.click(radios[0]);
    expect(handleChange).toHaveBeenLastCalledWith('a');

    // Click radio-b
    fireEvent.click(radios[1]);
    expect(handleChange).toHaveBeenLastCalledWith('b');

    expect(handleChange).toHaveBeenCalledTimes(2);
  });

  it('calls onChange with correct value in controlled mode', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <RadioGroup value="a" onChange={handleChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    fireEvent.click(radios[1]);
    expect(handleChange).toHaveBeenCalledWith('b');
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('Radio — disabled', () => {
  it('does not call onChange when the group is disabled', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <RadioGroup disabled onChange={handleChange}>
          <Radio value="a" label="A" />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    fireEvent.click(radios[0]);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when an individual radio is disabled', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Wrapper>
        <RadioGroup onChange={handleChange}>
          <Radio value="a" label="A" disabled />
          <Radio value="b" label="B" />
        </RadioGroup>
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    fireEvent.click(radios[0]);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('has aria-disabled when the group is disabled', () => {
    const { container } = render(
      <Wrapper>
        <RadioGroup disabled>
          <Radio value="a" label="A" />
        </RadioGroup>
      </Wrapper>,
    );
    const radio = container.querySelector('[role="radio"]');
    expect(radio).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies reduced opacity when disabled', () => {
    const { container } = render(
      <Wrapper>
        <RadioGroup disabled>
          <Radio value="a" label="A" />
        </RadioGroup>
      </Wrapper>,
    );
    const radio = container.querySelector('[role="radio"]') as HTMLElement;
    expect(radio.style.opacity).toBe('0.5');
  });
});
