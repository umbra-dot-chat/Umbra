/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Text } from './Text';
import { textSizes } from '@coexist/wisp-core/tokens/shared';
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

describe('Text — rendering', () => {
  it('renders text content', () => {
    render(<Wrapper><Text>Hello world</Text></Wrapper>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(<Wrapper><Text /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders with iconLeft and iconRight', () => {
    render(
      <Wrapper>
        <Text
          iconLeft={<span data-testid="icon-left">L</span>}
          iconRight={<span data-testid="icon-right">R</span>}
        >
          With icons
        </Text>
      </Wrapper>,
    );
    expect(screen.getByText('With icons')).toBeInTheDocument();
    expect(screen.getByTestId('icon-left')).toBeInTheDocument();
    expect(screen.getByTestId('icon-right')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Text — sizes', () => {
  textSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Wrapper><Text size={size}>{size}</Text></Wrapper>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

describe('Text — weights', () => {
  const weights = ['regular', 'medium', 'semibold', 'bold'] as const;

  weights.forEach((weight) => {
    it(`renders weight="${weight}" without crashing`, () => {
      render(<Wrapper><Text weight={weight}>{weight}</Text></Wrapper>);
      expect(screen.getByText(weight)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

describe('Text — colors', () => {
  const colors = ['primary', 'secondary', 'tertiary', 'brand'] as const;

  colors.forEach((color) => {
    it(`renders color="${color}" without crashing`, () => {
      render(<Wrapper><Text color={color}>{color}</Text></Wrapper>);
      expect(screen.getByText(color)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Truncation
// ---------------------------------------------------------------------------

describe('Text — truncation', () => {
  it('renders with truncate prop', () => {
    render(<Wrapper><Text truncate>Truncated text</Text></Wrapper>);
    expect(screen.getByText('Truncated text')).toBeInTheDocument();
  });

  it('renders with maxLines prop', () => {
    render(<Wrapper><Text maxLines={3}>Multiline text</Text></Wrapper>);
    expect(screen.getByText('Multiline text')).toBeInTheDocument();
  });
});
