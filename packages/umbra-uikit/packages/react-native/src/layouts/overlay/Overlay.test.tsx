/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Overlay } from './Overlay';
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

describe('Overlay — rendering', () => {
  it('renders children when open', () => {
    render(
      <Wrapper>
        <Overlay open useModal={false}>
          <span>Overlay content</span>
        </Overlay>
      </Wrapper>,
    );
    expect(screen.getByText('Overlay content')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    const { queryByText } = render(
      <Wrapper>
        <Overlay open={false} useModal={false}>
          <span>Hidden overlay</span>
        </Overlay>
      </Wrapper>,
    );
    expect(queryByText('Hidden overlay')).not.toBeInTheDocument();
  });

  it('renders without crashing with default props', () => {
    const { container } = render(
      <Wrapper>
        <Overlay open useModal={false}>
          <span>Default overlay</span>
        </Overlay>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('Default overlay')).toBeInTheDocument();
  });
});
