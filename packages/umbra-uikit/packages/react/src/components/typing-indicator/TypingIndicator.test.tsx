/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingIndicator } from './TypingIndicator';
import { typingIndicatorAnimations } from '.';
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

describe('TypingIndicator — rendering', () => {
  it('renders with role="status"', () => {
    render(
      <Dark>
        <TypingIndicator />
      </Dark>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders three dots', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <TypingIndicator ref={ref} />
      </Dark>,
    );
    const dots = ref.current!.querySelectorAll('span');
    expect(dots).toHaveLength(3);
  });

  it('has aria-label "Typing"', () => {
    render(
      <Dark>
        <TypingIndicator />
      </Dark>,
    );
    expect(screen.getByLabelText('Typing')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

describe('TypingIndicator — animations', () => {
  typingIndicatorAnimations.forEach((animation) => {
    it(`renders animation="${animation}" without crashing`, () => {
      render(
        <Dark>
          <TypingIndicator animation={animation} />
        </Dark>,
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Bubble mode
// ---------------------------------------------------------------------------

describe('TypingIndicator — bubble mode', () => {
  it('renders in bubble mode without crashing', () => {
    render(
      <Dark>
        <TypingIndicator bubble />
      </Dark>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders sender name when provided in bubble mode', () => {
    render(
      <Dark>
        <TypingIndicator bubble sender="Alice" />
      </Dark>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders avatar when provided in bubble mode', () => {
    render(
      <Dark>
        <TypingIndicator bubble avatar={<div data-testid="avatar">A</div>} />
      </Dark>,
    );
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('sets aria-label with sender name', () => {
    render(
      <Dark>
        <TypingIndicator bubble sender="Bob" />
      </Dark>,
    );
    expect(screen.getByLabelText('Bob is typing')).toBeInTheDocument();
  });

  it('does not render sender/avatar when not in bubble mode', () => {
    render(
      <Dark>
        <TypingIndicator sender="Alice" avatar={<div data-testid="avatar">A</div>} />
      </Dark>,
    );
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Custom props
// ---------------------------------------------------------------------------

describe('TypingIndicator — custom props', () => {
  it('applies custom dot size', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <TypingIndicator ref={ref} dotSize={12} />
      </Dark>,
    );
    const dot = ref.current!.querySelector('span') as HTMLElement;
    expect(dot.style.width).toBe('12px');
    expect(dot.style.height).toBe('12px');
  });

  it('applies custom color', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <TypingIndicator ref={ref} color="#ff0000" />
      </Dark>,
    );
    const dot = ref.current!.querySelector('span') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('TypingIndicator — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <TypingIndicator ref={ref} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref in bubble mode', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <TypingIndicator ref={ref} bubble />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('TypingIndicator — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <TypingIndicator className="custom-typing" />
      </Dark>,
    );
    expect(container.querySelector('.custom-typing')).toBeInTheDocument();
  });
});
