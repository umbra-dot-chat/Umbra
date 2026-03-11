/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert } from './Alert';
import { alertVariants } from '@coexist/wisp-core/types/Alert.types';
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

describe('Alert — rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Wrapper><Alert title="Heads up" /></Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('has alert accessibility role', () => {
    render(
      <Wrapper><Alert title="Notice" /></Wrapper>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Alert — variants', () => {
  alertVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(
        <Wrapper><Alert variant={variant} title={variant} /></Wrapper>,
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Message text
// ---------------------------------------------------------------------------

describe('Alert — message text', () => {
  it('renders title text', () => {
    render(
      <Wrapper><Alert title="Important notice" /></Wrapper>,
    );
    expect(screen.getByText('Important notice')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <Wrapper>
        <Alert title="Warning" description="Something needs your attention." />
      </Wrapper>,
    );
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Something needs your attention.')).toBeInTheDocument();
  });

  it('renders string children as body text', () => {
    render(
      <Wrapper>
        <Alert title="Info">This is the body content.</Alert>
      </Wrapper>,
    );
    expect(screen.getByText('This is the body content.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Action slot
// ---------------------------------------------------------------------------

describe('Alert — action slot', () => {
  it('renders an action element', () => {
    render(
      <Wrapper>
        <Alert
          title="Update available"
          action={<span data-testid="alert-action">Update</span>}
        />
      </Wrapper>,
    );
    expect(screen.getByTestId('alert-action')).toBeInTheDocument();
  });

  it('renders an icon element', () => {
    render(
      <Wrapper>
        <Alert
          title="With icon"
          icon={<span data-testid="alert-icon">!</span>}
        />
      </Wrapper>,
    );
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });
});
