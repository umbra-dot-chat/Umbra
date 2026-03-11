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

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const Light = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="light">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Alert — rendering', () => {
  it('renders with role="alert"', () => {
    render(<Dark><Alert title="Heads up" /></Dark>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders title text', () => {
    render(<Dark><Alert title="Saved" /></Dark>);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders title as a <p> element', () => {
    render(<Dark><Alert title="Saved" /></Dark>);
    expect(screen.getByText('Saved').tagName).toBe('P');
  });

  it('renders description text', () => {
    render(<Dark><Alert title="Done" description="Your changes have been saved." /></Dark>);
    expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument();
  });

  it('renders description as a <p> element', () => {
    render(<Dark><Alert description="Body text here." /></Dark>);
    expect(screen.getByText('Body text here.').tagName).toBe('P');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Alert — variants', () => {
  alertVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Dark><Alert variant={variant} title={variant} /></Dark>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Icon slot
// ---------------------------------------------------------------------------

describe('Alert — icon', () => {
  it('renders icon when provided', () => {
    const icon = <svg data-testid="alert-icon" />;
    render(<Dark><Alert title="Info" icon={icon} /></Dark>);
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('does not render icon wrapper when icon is not provided', () => {
    const { container } = render(<Dark><Alert title="No icon" /></Dark>);
    const alertEl = screen.getByRole('alert');
    // The first child should be the content div, not an icon span
    expect(alertEl.firstElementChild?.tagName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Action slot
// ---------------------------------------------------------------------------

describe('Alert — action', () => {
  it('renders action when provided', () => {
    const action = <button data-testid="alert-action">Retry</button>;
    render(<Dark><Alert title="Error" action={action} /></Dark>);
    expect(screen.getByTestId('alert-action')).toBeInTheDocument();
  });

  it('does not render action wrapper when action is not provided', () => {
    const { container } = render(<Dark><Alert title="No action" /></Dark>);
    const alertEl = screen.getByRole('alert');
    // Only the content div should be present
    expect(alertEl.children.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Children fallback
// ---------------------------------------------------------------------------

describe('Alert — children fallback', () => {
  it('uses children when no description is provided', () => {
    render(<Dark><Alert title="Note">Fallback body content</Alert></Dark>);
    expect(screen.getByText('Fallback body content')).toBeInTheDocument();
  });

  it('prefers description over children', () => {
    render(
      <Dark>
        <Alert title="Note" description="Description wins">
          Children lose
        </Alert>
      </Dark>,
    );
    expect(screen.getByText('Description wins')).toBeInTheDocument();
    expect(screen.queryByText('Children lose')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Alert — className', () => {
  it('passes className through to the root element', () => {
    render(<Dark><Alert title="Styled" className="custom-alert" /></Dark>);
    expect(screen.getByRole('alert')).toHaveClass('custom-alert');
  });
});
