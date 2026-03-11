/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Mock react-native-svg (Fabric native component cannot resolve in jsdom)
// ---------------------------------------------------------------------------

vi.mock('react-native-svg', () => {
  const React = require('react');
  const createComponent = (name: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
      React.createElement(name.toLowerCase(), { ...props, ref }),
    );
  return {
    __esModule: true,
    default: createComponent('svg'),
    Svg: createComponent('svg'),
    Circle: createComponent('circle'),
    Rect: createComponent('rect'),
    Path: createComponent('path'),
    G: createComponent('g'),
    Defs: createComponent('defs'),
    ClipPath: createComponent('clipPath'),
    Line: createComponent('line'),
    Polygon: createComponent('polygon'),
    Polyline: createComponent('polyline'),
    Text: createComponent('text'),
  };
});

import { Select } from './Select';
import type { SelectOption } from './Select';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const sampleOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Select — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Select options={sampleOptions} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('shows placeholder text when no value is selected', () => {
    render(
      <Wrapper>
        <Select options={sampleOptions} placeholder="Pick a fruit" />
      </Wrapper>,
    );
    expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
  });

  it('shows the default placeholder when none is provided', () => {
    render(
      <Wrapper>
        <Select options={sampleOptions} />
      </Wrapper>,
    );
    // Default placeholder is 'Select...' (with unicode ellipsis)
    expect(screen.getByText(/Select/)).toBeInTheDocument();
  });

  it('shows selected option label when value is provided', () => {
    render(
      <Wrapper>
        <Select options={sampleOptions} value="banana" />
      </Wrapper>,
    );
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Label and error
// ---------------------------------------------------------------------------

describe('Select — label and error', () => {
  it('renders label text', () => {
    render(
      <Wrapper>
        <Select options={sampleOptions} label="Fruit" />
      </Wrapper>,
    );
    expect(screen.getByText('Fruit')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(
      <Wrapper>
        <Select options={sampleOptions} error="Required field" />
      </Wrapper>,
    );
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Select — sizes', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper>
          <Select options={sampleOptions} size={size} placeholder={size} />
        </Wrapper>,
      );
      expect(container).toBeTruthy();
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// onChange
// ---------------------------------------------------------------------------

describe('Select — onChange', () => {
  it('calls onChange when defaultValue is used and an option is selected (uncontrolled)', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <Select options={sampleOptions} onChange={onChange} placeholder="Choose" />
      </Wrapper>,
    );
    // Click the trigger to open the modal
    const trigger = screen.getByText('Choose').closest('[role="button"]');
    fireEvent.click(trigger!);
    // Now the modal with options should be visible
    const optionEl = screen.getByText('Apple');
    fireEvent.click(optionEl);
    expect(onChange).toHaveBeenCalledWith('apple');
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Select — disabled', () => {
  it('renders with disabled state without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Select options={sampleOptions} disabled placeholder="Disabled" />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});
