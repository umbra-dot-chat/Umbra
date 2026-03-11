/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultOptions = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('SegmentedControl — rendering', () => {
  it('renders all segment labels', () => {
    render(
      <Wrapper>
        <SegmentedControl options={defaultOptions} />
      </Wrapper>,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
  });

  it('renders with a controlled value', () => {
    render(
      <Wrapper>
        <SegmentedControl options={defaultOptions} value="two" />
      </Wrapper>,
    );
    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('renders without crashing when options is empty', () => {
    const { container } = render(
      <Wrapper>
        <SegmentedControl options={[]} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Active segment
// ---------------------------------------------------------------------------

describe('SegmentedControl — active segment', () => {
  it('marks the controlled value segment as checked via accessibility state', () => {
    render(
      <Wrapper>
        <SegmentedControl options={defaultOptions} value="two" />
      </Wrapper>,
    );
    const activeSegment = screen.getByText('Two').closest('[role="radio"]');
    expect(activeSegment).toHaveAttribute('aria-checked', 'true');
  });

  it('marks other segments as not checked', () => {
    render(
      <Wrapper>
        <SegmentedControl options={defaultOptions} value="two" />
      </Wrapper>,
    );
    const inactiveSegment = screen.getByText('One').closest('[role="radio"]');
    expect(inactiveSegment).toHaveAttribute('aria-checked', 'false');
  });

  it('defaults to the first option when no value or defaultValue is provided', () => {
    render(
      <Wrapper>
        <SegmentedControl options={defaultOptions} />
      </Wrapper>,
    );
    const firstSegment = screen.getByText('One').closest('[role="radio"]');
    expect(firstSegment).toHaveAttribute('aria-checked', 'true');
  });

  it('respects defaultValue for uncontrolled mode', () => {
    render(
      <Wrapper>
        <SegmentedControl options={defaultOptions} defaultValue="three" />
      </Wrapper>,
    );
    const thirdSegment = screen.getByText('Three').closest('[role="radio"]');
    expect(thirdSegment).toHaveAttribute('aria-checked', 'true');
  });
});

// ---------------------------------------------------------------------------
// onChange
// ---------------------------------------------------------------------------

describe('SegmentedControl — onChange', () => {
  it('calls onChange when a segment is pressed', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <SegmentedControl options={defaultOptions} value="one" onChange={onChange} />
      </Wrapper>,
    );
    const secondSegment = screen.getByText('Two').closest('[role="radio"]');
    fireEvent.click(secondSegment!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('two');
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <SegmentedControl options={defaultOptions} value="one" onChange={onChange} disabled />
      </Wrapper>,
    );
    const secondSegment = screen.getByText('Two').closest('[role="radio"]');
    fireEvent.click(secondSegment!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when a disabled option is pressed', () => {
    const onChange = vi.fn();
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    render(
      <Wrapper>
        <SegmentedControl options={options} value="a" onChange={onChange} />
      </Wrapper>,
    );
    const disabledSegment = screen.getByText('B').closest('[role="radio"]');
    fireEvent.click(disabledSegment!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('SegmentedControl — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <SegmentedControl options={defaultOptions} size={size} />
        </Wrapper>,
      );
      expect(screen.getByText('One')).toBeInTheDocument();
    });
  });
});
