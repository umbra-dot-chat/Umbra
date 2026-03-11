/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toast } from './Toast';
import { toastVariants } from '@coexist/wisp-core/types/Toast.types';
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

describe('Toast — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper><Toast title="Notification" /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('has alert accessibility role', () => {
    render(
      <Wrapper><Toast title="Saved" /></Wrapper>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Toast — variants', () => {
  toastVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(
        <Wrapper><Toast variant={variant} title={variant} /></Wrapper>,
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Message text
// ---------------------------------------------------------------------------

describe('Toast — message text', () => {
  it('renders title text', () => {
    render(
      <Wrapper><Toast title="Changes saved" /></Wrapper>,
    );
    expect(screen.getByText('Changes saved')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <Wrapper>
        <Toast title="Error" description="Something went wrong." />
      </Wrapper>,
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Dismiss
// ---------------------------------------------------------------------------

describe('Toast — dismiss', () => {
  it('renders dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(
      <Wrapper><Toast title="Dismissible" onDismiss={onDismiss} /></Wrapper>,
    );
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('does not render dismiss button when dismissible is false', () => {
    const onDismiss = vi.fn();
    render(
      <Wrapper>
        <Toast title="Not dismissible" onDismiss={onDismiss} dismissible={false} />
      </Wrapper>,
    );
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(
      <Wrapper><Toast title="No dismiss" /></Wrapper>,
    );
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });
});
