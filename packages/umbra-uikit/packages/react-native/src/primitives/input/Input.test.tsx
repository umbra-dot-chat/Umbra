/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';
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

describe('Input — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<Wrapper><Input /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders with a placeholder', () => {
    render(<Wrapper><Input placeholder="Enter text" /></Wrapper>);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with a label', () => {
    render(<Wrapper><Input label="Email" /></Wrapper>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders with hint text', () => {
    render(<Wrapper><Input hint="Required field" /></Wrapper>);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Wrapper><Input error="Invalid email" /></Wrapper>);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('renders warning message', () => {
    render(<Wrapper><Input warning="Check format" /></Wrapper>);
    expect(screen.getByText('Check format')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Input — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Wrapper><Input size={size} placeholder={size} /></Wrapper>);
      expect(screen.getByPlaceholderText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Input — disabled', () => {
  it('renders in disabled state', () => {
    const { container } = render(
      <Wrapper><Input disabled placeholder="Disabled input" /></Wrapper>,
    );
    expect(screen.getByPlaceholderText('Disabled input')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Text change
// ---------------------------------------------------------------------------

describe('Input — onChangeText', () => {
  it('calls onChangeText when text changes', () => {
    const onChangeText = vi.fn();
    render(
      <Wrapper><Input placeholder="type here" onChangeText={onChangeText} /></Wrapper>,
    );
    const input = screen.getByPlaceholderText('type here');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChangeText).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

describe('Input — icons', () => {
  it('renders with a leading icon', () => {
    const MockIcon = () => <span data-testid="leading-icon" />;
    render(<Wrapper><Input icon={MockIcon} placeholder="Search" /></Wrapper>);
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
  });

  it('renders with a trailing icon', () => {
    const MockIcon = () => <span data-testid="trailing-icon" />;
    render(<Wrapper><Input trailingIcon={MockIcon} placeholder="Password" /></Wrapper>);
    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Full width
// ---------------------------------------------------------------------------

describe('Input — fullWidth', () => {
  it('renders with fullWidth prop without crashing', () => {
    render(<Wrapper><Input fullWidth placeholder="Full" /></Wrapper>);
    expect(screen.getByPlaceholderText('Full')).toBeInTheDocument();
  });
});
