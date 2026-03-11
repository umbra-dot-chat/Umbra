/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingIndicator } from './TypingIndicator';
import { typingIndicatorAnimations } from '@coexist/wisp-core/types/TypingIndicator.types';
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

describe('TypingIndicator — rendering', () => {
  it('renders with accessibility label "Typing"', () => {
    render(<Wrapper><TypingIndicator /></Wrapper>);
    expect(screen.getByLabelText('Typing')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

describe('TypingIndicator — animations', () => {
  typingIndicatorAnimations.forEach((animation) => {
    it(`renders animation="${animation}" without crashing`, () => {
      render(<Wrapper><TypingIndicator animation={animation} /></Wrapper>);
      expect(screen.getByLabelText('Typing')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Bubble mode
// ---------------------------------------------------------------------------

describe('TypingIndicator — bubble mode', () => {
  it('renders in bubble mode without crashing', () => {
    render(<Wrapper><TypingIndicator bubble /></Wrapper>);
    expect(screen.getByLabelText('Typing')).toBeInTheDocument();
  });

  it('renders sender name when provided', () => {
    render(<Wrapper><TypingIndicator bubble sender="Alice" /></Wrapper>);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders avatar when provided', () => {
    render(
      <Wrapper>
        <TypingIndicator bubble avatar={<div data-testid="avatar">A</div>} />
      </Wrapper>,
    );
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('sets accessibility label with sender name', () => {
    render(<Wrapper><TypingIndicator bubble sender="Bob" /></Wrapper>);
    expect(screen.getByLabelText('Bob is typing')).toBeInTheDocument();
  });

  it('does not render sender/avatar when not in bubble mode', () => {
    render(
      <Wrapper>
        <TypingIndicator sender="Alice" avatar={<div data-testid="avatar">A</div>} />
      </Wrapper>,
    );
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
  });
});
