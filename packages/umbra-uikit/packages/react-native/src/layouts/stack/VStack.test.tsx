/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VStack } from './Stack';
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

describe('VStack — rendering', () => {
  it('renders children text', () => {
    render(
      <Wrapper>
        <VStack>
          <span>Top</span>
          <span>Bottom</span>
        </VStack>
      </Wrapper>,
    );
    expect(screen.getByText('Top')).toBeInTheDocument();
    expect(screen.getByText('Bottom')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(
      <Wrapper>
        <VStack />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

describe('VStack — vertical direction', () => {
  it('renders with flexDirection: column', () => {
    render(
      <Wrapper>
        <VStack testID="vstack">
          <span>Item</span>
        </VStack>
      </Wrapper>,
    );
    const el = screen.getByTestId('vstack');
    expect(el.style.flexDirection).toBe('column');
  });

  it('applies reverse (flexDirection: column-reverse)', () => {
    render(
      <Wrapper>
        <VStack reverse testID="vstack">
          <span>Item</span>
        </VStack>
      </Wrapper>,
    );
    const el = screen.getByTestId('vstack');
    expect(el.style.flexDirection).toBe('column-reverse');
  });
});

// ---------------------------------------------------------------------------
// Gap
// ---------------------------------------------------------------------------

describe('VStack — gap', () => {
  it('defaults to md gap (12px)', () => {
    render(
      <Wrapper>
        <VStack testID="vstack">
          <span>Item</span>
        </VStack>
      </Wrapper>,
    );
    const el = screen.getByTestId('vstack');
    expect(el.style.gap).toBe('12px');
  });

  it('applies custom gap token', () => {
    render(
      <Wrapper>
        <VStack gap="lg" testID="vstack">
          <span>Item</span>
        </VStack>
      </Wrapper>,
    );
    const el = screen.getByTestId('vstack');
    expect(el.style.gap).toBe('16px');
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('VStack — displayName', () => {
  it('has correct displayName', () => {
    expect(VStack.displayName).toBe('VStack');
  });
});
