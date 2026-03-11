/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Banner } from './Banner';
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

describe('Banner — rendering', () => {
  it('renders the message text', () => {
    render(
      <Wrapper>
        <Banner>Something went wrong.</Banner>
      </Wrapper>,
    );
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('renders a title when provided', () => {
    render(
      <Wrapper>
        <Banner title="Heads up">Check your settings.</Banner>
      </Wrapper>,
    );
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Check your settings.')).toBeInTheDocument();
  });

  it('has alert accessibility role', () => {
    const { container } = render(
      <Wrapper>
        <Banner>Alert message</Banner>
      </Wrapper>,
    );
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
  });

  it('has correct displayName', () => {
    expect(Banner.displayName).toBe('Banner');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Banner — variants', () => {
  const variants = ['default', 'info', 'success', 'warning', 'danger'] as const;

  variants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(
        <Wrapper>
          <Banner variant={variant}>Variant test</Banner>
        </Wrapper>,
      );
      expect(screen.getByText('Variant test')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Dismissible
// ---------------------------------------------------------------------------

describe('Banner — dismissible', () => {
  it('does not render dismiss button by default', () => {
    const { container } = render(
      <Wrapper>
        <Banner>No dismiss</Banner>
      </Wrapper>,
    );
    const dismissBtn = container.querySelector('[aria-label="Dismiss"]');
    expect(dismissBtn).toBeNull();
  });

  it('renders dismiss button when dismissible=true', () => {
    const { container } = render(
      <Wrapper>
        <Banner dismissible>Dismissible banner</Banner>
      </Wrapper>,
    );
    const dismissBtn = container.querySelector('[aria-label="Dismiss"]');
    expect(dismissBtn).toBeTruthy();
  });

  it('calls onDismiss when dismiss button is pressed', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <Wrapper>
        <Banner dismissible onDismiss={onDismiss}>
          Dismiss me
        </Banner>
      </Wrapper>,
    );
    const dismissBtn = container.querySelector('[aria-label="Dismiss"]');
    fireEvent.click(dismissBtn!);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Icon & action
// ---------------------------------------------------------------------------

describe('Banner — icon and action', () => {
  it('renders custom icon when provided', () => {
    render(
      <Wrapper>
        <Banner icon={<span data-testid="custom-icon">!</span>}>
          With icon
        </Banner>
      </Wrapper>,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(
      <Wrapper>
        <Banner action={<button data-testid="action-btn">Retry</button>}>
          With action
        </Banner>
      </Wrapper>,
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });
});
