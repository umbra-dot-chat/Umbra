/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Kbd } from './Kbd';
import { kbdSizes } from '@coexist/wisp-core/types/Kbd.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Kbd — rendering', () => {
  it('renders children text', () => {
    render(<Dark><Kbd>⌘K</Kbd></Dark>);
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('renders as a <kbd> element', () => {
    render(<Dark><Kbd>Esc</Kbd></Dark>);
    const el = screen.getByText('Esc');
    expect(el.tagName.toLowerCase()).toBe('kbd');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Kbd — sizes', () => {
  kbdSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Kbd size={size}>{size}</Kbd></Dark>);
      expect(screen.getByText(size)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Kbd — className', () => {
  it('passes className through', () => {
    render(<Dark><Kbd className="custom">Enter</Kbd></Dark>);
    expect(screen.getByText('Enter')).toHaveClass('custom');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Kbd — style merge', () => {
  it('user style overrides are applied', () => {
    render(<Dark><Kbd style={{ marginTop: 42 }}>Tab</Kbd></Dark>);
    expect(screen.getByText('Tab')).toHaveStyle({ marginTop: '42px' });
  });
});
