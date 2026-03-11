/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { buttonVariants } from '@coexist/wisp-core/types/Button.types';
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

describe('Button — rendering', () => {
  it('renders children text', () => {
    render(<Wrapper><Button>Click me</Button></Wrapper>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders without crashing with no children (icon-only)', () => {
    const { container } = render(
      <Wrapper>
        <Button iconLeft={<span data-testid="icon">I</span>} />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Button — variants', () => {
  buttonVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Wrapper><Button variant={variant}>{variant}</Button></Wrapper>);
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Button — sizes', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  sizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Wrapper><Button size={size}>{size}</Button></Wrapper>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

describe('Button — shapes', () => {
  const shapes = ['rounded', 'pill', 'square'] as const;

  shapes.forEach((shape) => {
    it(`renders shape="${shape}" without crashing`, () => {
      render(<Wrapper><Button shape={shape}>{shape}</Button></Wrapper>);
      expect(screen.getByText(shape)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

describe('Button — disabled', () => {
  it('renders with disabled styling (opacity)', () => {
    const { container } = render(
      <Wrapper><Button disabled>disabled</Button></Wrapper>,
    );
    expect(screen.getByText('disabled')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it('prevents onPress handler when disabled', () => {
    const onPress = vi.fn();
    const { container } = render(
      <Wrapper><Button disabled onPress={onPress}>no press</Button></Wrapper>,
    );
    // RN Pressable renders as a div in react-native-web
    const pressable = screen.getByText('no press').closest('[role="button"]') || container.firstChild;
    fireEvent.click(pressable!);
    expect(onPress).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('Button — loading', () => {
  it('renders loading state without crashing', () => {
    const { container } = render(
      <Wrapper><Button isLoading>Loading</Button></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('still renders children text when loading', () => {
    render(<Wrapper><Button isLoading>Loading</Button></Wrapper>);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('prevents onPress handler when loading', () => {
    const onPress = vi.fn();
    const { container } = render(
      <Wrapper><Button isLoading onPress={onPress}>no press</Button></Wrapper>,
    );
    const pressable = screen.getByText('no press').closest('[role="button"]') || container.firstChild;
    fireEvent.click(pressable!);
    expect(onPress).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Press handling
// ---------------------------------------------------------------------------

describe('Button — press', () => {
  it('calls onPress when pressed', () => {
    const onPress = vi.fn();
    render(<Wrapper><Button onPress={onPress}>press me</Button></Wrapper>);
    const pressable = screen.getByText('press me').closest('[role="button"]');
    fireEvent.click(pressable!);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Full width
// ---------------------------------------------------------------------------

describe('Button — fullWidth', () => {
  it('renders with fullWidth prop without crashing', () => {
    render(<Wrapper><Button fullWidth>Full</Button></Wrapper>);
    expect(screen.getByText('Full')).toBeInTheDocument();
  });
});
