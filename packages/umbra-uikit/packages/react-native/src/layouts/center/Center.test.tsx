/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Center } from './Center';
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

describe('Center — rendering', () => {
  it('renders children text', () => {
    render(
      <Wrapper>
        <Center>Centered content</Center>
      </Wrapper>,
    );
    expect(screen.getByText('Centered content')).toBeInTheDocument();
  });

  it('renders without crashing when no children provided', () => {
    const { container } = render(
      <Wrapper>
        <Center />
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders nested children', () => {
    render(
      <Wrapper>
        <Center>
          <span>Child A</span>
          <span>Child B</span>
        </Center>
      </Wrapper>,
    );
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Centering styles
// ---------------------------------------------------------------------------

describe('Center — centering styles', () => {
  it('applies justifyContent: center', () => {
    render(
      <Wrapper>
        <Center testID="center">Content</Center>
      </Wrapper>,
    );
    expect(screen.getByTestId('center').style.justifyContent).toBe('center');
  });

  it('applies alignItems: center', () => {
    render(
      <Wrapper>
        <Center testID="center">Content</Center>
      </Wrapper>,
    );
    expect(screen.getByTestId('center').style.alignItems).toBe('center');
  });
});

// ---------------------------------------------------------------------------
// Style passthrough
// ---------------------------------------------------------------------------

describe('Center — style passthrough', () => {
  it('merges user style with centering style', () => {
    render(
      <Wrapper>
        <Center style={{ backgroundColor: 'red' }} testID="center">Content</Center>
      </Wrapper>,
    );
    const el = screen.getByTestId('center');
    expect(el.style.justifyContent).toBe('center');
    expect(el.style.alignItems).toBe('center');
    // react-native-web normalizes color names to rgb()
    expect(el.style.backgroundColor).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

describe('Center — displayName', () => {
  it('has correct displayName', () => {
    expect(Center.displayName).toBe('Center');
  });
});
