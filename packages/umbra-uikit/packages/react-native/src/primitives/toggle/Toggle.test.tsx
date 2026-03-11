/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toggle } from './Toggle';
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

describe('Toggle — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<Wrapper><Toggle /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders with a label for accessibility', () => {
    const { container } = render(
      <Wrapper><Toggle label="Dark mode" /></Wrapper>,
    );
    // react-native-web maps accessibilityLabel to aria-label
    const toggle = container.querySelector('[aria-label="Dark mode"]');
    expect(toggle).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Checked state
// ---------------------------------------------------------------------------

describe('Toggle — checked state', () => {
  it('renders in unchecked state by default and toggles to true on press', () => {
    const onChange = vi.fn();
    const { container } = render(<Wrapper><Toggle onChange={onChange} /></Wrapper>);
    const toggle = container.querySelector('[role="switch"]');
    expect(toggle).toBeTruthy();
    // Default state is unchecked, so pressing should yield true
    fireEvent.click(toggle!);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders in checked state when checked=true and toggles to false on press', () => {
    const onChange = vi.fn();
    const { container } = render(<Wrapper><Toggle checked={true} onChange={onChange} /></Wrapper>);
    const toggle = container.querySelector('[role="switch"]');
    expect(toggle).toBeTruthy();
    // Already checked, pressing should yield false
    fireEvent.click(toggle!);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('renders with defaultChecked=true and toggles to false on press', () => {
    const onChange = vi.fn();
    const { container } = render(<Wrapper><Toggle defaultChecked={true} onChange={onChange} /></Wrapper>);
    const toggle = container.querySelector('[role="switch"]');
    expect(toggle).toBeTruthy();
    // defaultChecked=true, so pressing should yield false
    fireEvent.click(toggle!);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// onChange callback
// ---------------------------------------------------------------------------

describe('Toggle — onChange', () => {
  it('calls onChange with the new value when pressed', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper><Toggle onChange={onChange} /></Wrapper>,
    );
    const toggle = container.querySelector('[role="switch"]');
    fireEvent.click(toggle!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when toggling off', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper><Toggle checked={true} onChange={onChange} /></Wrapper>,
    );
    const toggle = container.querySelector('[role="switch"]');
    fireEvent.click(toggle!);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Toggle — disabled', () => {
  it('renders in disabled state', () => {
    const { container } = render(
      <Wrapper><Toggle disabled /></Wrapper>,
    );
    const toggle = container.querySelector('[role="switch"]');
    expect(toggle).toBeTruthy();
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Wrapper><Toggle disabled onChange={onChange} /></Wrapper>,
    );
    const toggle = container.querySelector('[role="switch"]');
    fireEvent.click(toggle!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Toggle — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(<Wrapper><Toggle size={size} /></Wrapper>);
      const toggle = container.querySelector('[role="switch"]');
      expect(toggle).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Slim variant
// ---------------------------------------------------------------------------

describe('Toggle — slim', () => {
  it('renders with slim prop without crashing', () => {
    const { container } = render(<Wrapper><Toggle slim /></Wrapper>);
    const toggle = container.querySelector('[role="switch"]');
    expect(toggle).toBeTruthy();
  });
});
