/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Stack } from './Stack';
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

describe('Stack — rendering', () => {
  it('renders children text', () => {
    render(
      <Wrapper>
        <Stack>
          <span>Child A</span>
          <span>Child B</span>
        </Stack>
      </Wrapper>,
    );
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(
      <Wrapper>
        <Stack />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

describe('Stack — direction', () => {
  it('defaults to vertical (flexDirection: column)', () => {
    render(
      <Wrapper>
        <Stack testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexDirection).toBe('column');
  });

  it('applies direction="horizontal" (flexDirection: row)', () => {
    render(
      <Wrapper>
        <Stack direction="horizontal" testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexDirection).toBe('row');
  });

  it('applies direction="vertical" (flexDirection: column)', () => {
    render(
      <Wrapper>
        <Stack direction="vertical" testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexDirection).toBe('column');
  });

  it('applies reverse with horizontal direction', () => {
    render(
      <Wrapper>
        <Stack direction="horizontal" reverse testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexDirection).toBe('row-reverse');
  });

  it('applies reverse with vertical direction', () => {
    render(
      <Wrapper>
        <Stack direction="vertical" reverse testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexDirection).toBe('column-reverse');
  });
});

// ---------------------------------------------------------------------------
// Gap
// ---------------------------------------------------------------------------

describe('Stack — gap', () => {
  it('defaults to md gap (12px)', () => {
    render(
      <Wrapper>
        <Stack testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('12px');
  });

  it('applies gap="sm" (8px)', () => {
    render(
      <Wrapper>
        <Stack gap="sm" testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('8px');
  });

  it('applies gap="lg" (16px)', () => {
    render(
      <Wrapper>
        <Stack gap="lg" testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('16px');
  });

  it('applies gap="xl" (24px)', () => {
    render(
      <Wrapper>
        <Stack gap="xl" testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('24px');
  });

  it('applies numeric gap value', () => {
    render(
      <Wrapper>
        <Stack gap={20} testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.gap).toBe('20px');
  });
});

// ---------------------------------------------------------------------------
// Alignment and justification
// ---------------------------------------------------------------------------

describe('Stack — alignment', () => {
  it('applies align="center"', () => {
    render(
      <Wrapper>
        <Stack align="center" testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.alignItems).toBe('center');
  });

  it('applies justify="between"', () => {
    render(
      <Wrapper>
        <Stack justify="between" testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.justifyContent).toBe('space-between');
  });
});

// ---------------------------------------------------------------------------
// Wrap
// ---------------------------------------------------------------------------

describe('Stack — wrap', () => {
  it('defaults to nowrap', () => {
    render(
      <Wrapper>
        <Stack testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexWrap).toBe('nowrap');
  });

  it('applies wrap', () => {
    render(
      <Wrapper>
        <Stack wrap testID="stack">
          <span>Item</span>
        </Stack>
      </Wrapper>,
    );
    const el = screen.getByTestId('stack');
    expect(el.style.flexWrap).toBe('wrap');
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('Stack — displayName', () => {
  it('has correct displayName', () => {
    expect(Stack.displayName).toBe('Stack');
  });
});
