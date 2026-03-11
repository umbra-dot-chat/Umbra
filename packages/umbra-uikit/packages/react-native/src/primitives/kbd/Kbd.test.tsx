/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Kbd } from './Kbd';
import { WispProvider } from '../../providers';
import { kbdSizes } from '@coexist/wisp-core/types/Kbd.types';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering — text
// ---------------------------------------------------------------------------

describe('Kbd — rendering', () => {
  it('renders text content', () => {
    render(
      <Wrapper>
        <Kbd>Esc</Kbd>
      </Wrapper>,
    );
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('renders a key combination', () => {
    render(
      <Wrapper>
        <Kbd>Ctrl+C</Kbd>
      </Wrapper>,
    );
    expect(screen.getByText('Ctrl+C')).toBeInTheDocument();
  });

  it('renders without crashing with defaults', () => {
    const { container } = render(
      <Wrapper>
        <Kbd>K</Kbd>
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Kbd — sizes', () => {
  kbdSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Wrapper>
          <Kbd size={size}>{size}</Kbd>
        </Wrapper>,
      );
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});
