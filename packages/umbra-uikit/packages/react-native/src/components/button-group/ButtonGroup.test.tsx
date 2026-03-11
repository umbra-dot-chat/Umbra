/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ButtonGroup } from './ButtonGroup';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const defaultItems = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ButtonGroup — rendering', () => {
  it('renders all item labels', () => {
    render(
      <Wrapper>
        <ButtonGroup items={defaultItems} />
      </Wrapper>,
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Center')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('has radiogroup accessibility role', () => {
    const { container } = render(
      <Wrapper>
        <ButtonGroup items={defaultItems} />
      </Wrapper>,
    );
    const group = container.querySelector('[role="radiogroup"]');
    expect(group).toBeTruthy();
  });

  it('renders individual items with radio role', () => {
    const { container } = render(
      <Wrapper>
        <ButtonGroup items={defaultItems} />
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios.length).toBe(3);
  });

  it('has correct displayName', () => {
    expect(ButtonGroup.displayName).toBe('ButtonGroup');
  });
});

// ---------------------------------------------------------------------------
// Size prop
// ---------------------------------------------------------------------------

describe('ButtonGroup — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <ButtonGroup items={defaultItems} size={size} />
        </Wrapper>,
      );
      expect(screen.getByText('Left')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('ButtonGroup — selection', () => {
  it('selects the first item by default when no defaultValue', () => {
    const { container } = render(
      <Wrapper>
        <ButtonGroup items={defaultItems} />
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('respects defaultValue', () => {
    const { container } = render(
      <Wrapper>
        <ButtonGroup items={defaultItems} defaultValue="center" />
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('respects controlled value', () => {
    const { container } = render(
      <Wrapper>
        <ButtonGroup items={defaultItems} value="right" />
      </Wrapper>,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when an item is pressed', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <ButtonGroup items={defaultItems} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Center'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('center');
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('ButtonGroup — disabled', () => {
  it('does not call onChange when group is disabled', () => {
    const onChange = vi.fn();
    render(
      <Wrapper>
        <ButtonGroup items={defaultItems} disabled onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('Center'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when individual item is disabled', () => {
    const onChange = vi.fn();
    const items = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    render(
      <Wrapper>
        <ButtonGroup items={items} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByText('B'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
