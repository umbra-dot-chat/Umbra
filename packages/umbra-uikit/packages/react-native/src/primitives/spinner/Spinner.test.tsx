/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './Spinner';
import { componentSizes } from '@coexist/wisp-core/tokens/shared';
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

describe('Spinner — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper><Spinner /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with a label', () => {
    render(
      <Wrapper><Spinner label="Loading data" /></Wrapper>,
    );
    expect(screen.getByText('Loading data')).toBeInTheDocument();
  });

  it('has progressbar accessibility role', () => {
    render(
      <Wrapper><Spinner /></Wrapper>,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Spinner — sizes', () => {
  componentSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      const { container } = render(
        <Wrapper><Spinner size={size} /></Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  });
});
