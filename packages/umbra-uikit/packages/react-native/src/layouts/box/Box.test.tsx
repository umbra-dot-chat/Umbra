/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Box } from './Box';
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

describe('Box — rendering', () => {
  it('renders children text', () => {
    render(
      <Wrapper>
        <Box>Hello Box</Box>
      </Wrapper>,
    );
    expect(screen.getByText('Hello Box')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(
      <Wrapper>
        <Box />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders nested children', () => {
    render(
      <Wrapper>
        <Box>
          <span>Child A</span>
          <span>Child B</span>
        </Box>
      </Wrapper>,
    );
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Padding — shorthand `p`
// ---------------------------------------------------------------------------

describe('Box — padding (p shorthand)', () => {
  it('applies p="md" (12px) to all sides', () => {
    render(
      <Wrapper>
        <Box p="md" testID="box">Content</Box>
      </Wrapper>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('12px');
    expect(el.style.paddingRight).toBe('12px');
    expect(el.style.paddingBottom).toBe('12px');
    expect(el.style.paddingLeft).toBe('12px');
  });

  it('applies p="lg" (16px) to all sides', () => {
    render(
      <Wrapper>
        <Box p="lg" testID="box">Content</Box>
      </Wrapper>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('16px');
    expect(el.style.paddingRight).toBe('16px');
    expect(el.style.paddingBottom).toBe('16px');
    expect(el.style.paddingLeft).toBe('16px');
  });

  it('applies p="xs" (4px) to all sides', () => {
    render(
      <Wrapper>
        <Box p="xs" testID="box">Content</Box>
      </Wrapper>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('4px');
    expect(el.style.paddingRight).toBe('4px');
    expect(el.style.paddingBottom).toBe('4px');
    expect(el.style.paddingLeft).toBe('4px');
  });
});

// ---------------------------------------------------------------------------
// Padding — axis (px, py)
// ---------------------------------------------------------------------------

describe('Box — padding (px, py)', () => {
  it('applies px="lg" (16px) to left and right', () => {
    render(
      <Wrapper>
        <Box px="lg" testID="box">Content</Box>
      </Wrapper>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingLeft).toBe('16px');
    expect(el.style.paddingRight).toBe('16px');
  });

  it('applies py="xl" (24px) to top and bottom', () => {
    render(
      <Wrapper>
        <Box py="xl" testID="box">Content</Box>
      </Wrapper>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('24px');
    expect(el.style.paddingBottom).toBe('24px');
  });
});

// ---------------------------------------------------------------------------
// Padding — resolution order (specific > axis > shorthand)
// ---------------------------------------------------------------------------

describe('Box — padding resolution order', () => {
  it('side-specific overrides axis', () => {
    render(
      <Wrapper>
        <Box py="sm" pt="xl" testID="box">Content</Box>
      </Wrapper>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingTop).toBe('24px');
    expect(el.style.paddingBottom).toBe('8px');
  });

  it('axis overrides shorthand', () => {
    render(
      <Wrapper>
        <Box p="sm" px="xl" testID="box">Content</Box>
      </Wrapper>,
    );
    const el = screen.getByTestId('box');
    expect(el.style.paddingLeft).toBe('24px');
    expect(el.style.paddingRight).toBe('24px');
    expect(el.style.paddingTop).toBe('8px');
    expect(el.style.paddingBottom).toBe('8px');
  });
});

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

describe('Box — radius', () => {
  it('applies radius="md" (8px)', () => {
    render(
      <Wrapper>
        <Box radius="md" testID="box">Content</Box>
      </Wrapper>,
    );
    // react-native-web expands borderRadius into individual corner properties
    expect(screen.getByTestId('box').style.borderTopLeftRadius).toBe('8px');
  });

  it('applies radius="full" (9999px)', () => {
    render(
      <Wrapper>
        <Box radius="full" testID="box">Content</Box>
      </Wrapper>,
    );
    expect(screen.getByTestId('box').style.borderTopLeftRadius).toBe('9999px');
  });

  it('applies radius="none" (0)', () => {
    render(
      <Wrapper>
        <Box radius="none" testID="box">Content</Box>
      </Wrapper>,
    );
    const br = screen.getByTestId('box').style.borderTopLeftRadius;
    expect(br === '0' || br === '0px').toBe(true);
  });

  it('applies radius as number', () => {
    render(
      <Wrapper>
        <Box radius={20} testID="box">Content</Box>
      </Wrapper>,
    );
    expect(screen.getByTestId('box').style.borderTopLeftRadius).toBe('20px');
  });
});

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------

describe('Box — sizing', () => {
  it('applies width as number', () => {
    render(
      <Wrapper>
        <Box width={200} testID="box">Content</Box>
      </Wrapper>,
    );
    expect(screen.getByTestId('box').style.width).toBe('200px');
  });

  it('applies height as number', () => {
    render(
      <Wrapper>
        <Box height={100} testID="box">Content</Box>
      </Wrapper>,
    );
    expect(screen.getByTestId('box').style.height).toBe('100px');
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('Box — displayName', () => {
  it('has correct displayName', () => {
    expect(Box.displayName).toBe('Box');
  });
});
