/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Presence } from './Presence';
import { WispProvider } from '../providers';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Presence — rendering', () => {
  it('renders children when visible is true', () => {
    render(
      <Wrapper>
        <Presence visible>
          <span data-testid="child">Hello</span>
        </Presence>
      </Wrapper>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render children when visible is false', () => {
    render(
      <Wrapper>
        <Presence visible={false}>
          <span data-testid="hidden-child">Hidden</span>
        </Presence>
      </Wrapper>,
    );
    expect(screen.queryByTestId('hidden-child')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Animation variants (do not crash)
// ---------------------------------------------------------------------------

describe('Presence — animation variants', () => {
  const animations = ['fadeIn', 'scaleIn', 'slideUp', 'slideDown'] as const;

  animations.forEach((animation) => {
    it(`renders with animation="${animation}" without crashing`, () => {
      render(
        <Wrapper>
          <Presence visible animation={animation}>
            <span data-testid={`anim-${animation}`}>{animation}</span>
          </Presence>
        </Wrapper>,
      );
      expect(screen.getByTestId(`anim-${animation}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Custom duration
// ---------------------------------------------------------------------------

describe('Presence — custom duration', () => {
  it('accepts a custom duration without crashing', () => {
    render(
      <Wrapper>
        <Presence visible duration={500}>
          <span data-testid="custom-duration">Content</span>
        </Presence>
      </Wrapper>,
    );
    expect(screen.getByTestId('custom-duration')).toBeInTheDocument();
  });
});
