/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Sticky } from './Sticky';
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

describe('Sticky — rendering', () => {
  it('renders children content', () => {
    render(
      <Wrapper>
        <Sticky>
          <span>Sticky header</span>
        </Sticky>
      </Wrapper>,
    );
    expect(screen.getByText('Sticky header')).toBeInTheDocument();
  });

  it('renders without crashing with default props', () => {
    const { container } = render(
      <Wrapper>
        <Sticky>
          <span>Default sticky</span>
        </Sticky>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders with edge="bottom"', () => {
    render(
      <Wrapper>
        <Sticky edge="bottom">
          <span>Bottom sticky</span>
        </Sticky>
      </Wrapper>,
    );
    expect(screen.getByText('Bottom sticky')).toBeInTheDocument();
  });
});
