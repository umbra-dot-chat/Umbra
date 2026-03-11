/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HStack } from './Stack';
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

describe('HStack — rendering', () => {
  it('renders children text', () => {
    render(
      <Wrapper>
        <HStack>
          <span>Left</span>
          <span>Right</span>
        </HStack>
      </Wrapper>,
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(
      <Wrapper>
        <HStack />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

describe('HStack — horizontal direction', () => {
  it('renders with flexDirection: row', () => {
    render(
      <Wrapper>
        <HStack testID="hstack">
          <span>Item</span>
        </HStack>
      </Wrapper>,
    );
    const el = screen.getByTestId('hstack');
    expect(el.style.flexDirection).toBe('row');
  });

  it('applies reverse (flexDirection: row-reverse)', () => {
    render(
      <Wrapper>
        <HStack reverse testID="hstack">
          <span>Item</span>
        </HStack>
      </Wrapper>,
    );
    const el = screen.getByTestId('hstack');
    expect(el.style.flexDirection).toBe('row-reverse');
  });
});

// ---------------------------------------------------------------------------
// Gap
// ---------------------------------------------------------------------------

describe('HStack — gap', () => {
  it('defaults to md gap (12px)', () => {
    render(
      <Wrapper>
        <HStack testID="hstack">
          <span>Item</span>
        </HStack>
      </Wrapper>,
    );
    const el = screen.getByTestId('hstack');
    expect(el.style.gap).toBe('12px');
  });

  it('applies custom gap token', () => {
    render(
      <Wrapper>
        <HStack gap="xl" testID="hstack">
          <span>Item</span>
        </HStack>
      </Wrapper>,
    );
    const el = screen.getByTestId('hstack');
    expect(el.style.gap).toBe('24px');
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('HStack — displayName', () => {
  it('has correct displayName', () => {
    expect(HStack.displayName).toBe('HStack');
  });
});
