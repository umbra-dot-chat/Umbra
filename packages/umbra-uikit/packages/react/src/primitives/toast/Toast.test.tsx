/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toast } from './Toast';
import { toastVariants } from '@coexist/wisp-core/types/Toast.types';
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

describe('Toast — rendering', () => {
  it('renders with role="alert"', () => {
    render(<Dark><Toast title="Hello" /></Dark>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders title text', () => {
    render(<Dark><Toast title="Saved" /></Dark>);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    const { container } = render(<Dark><Toast title="Test" /></Dark>);
    expect(container.firstChild!.nodeName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

describe('Toast — description', () => {
  it('renders description text', () => {
    render(<Dark><Toast title="Done" description="Changes saved" /></Dark>);
    expect(screen.getByText('Changes saved')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<Dark><Toast title="Done" /></Dark>);
    // Title is a p, description would be a second p in the content div
    const contentDiv = container.querySelector('[role="alert"] > div');
    const paragraphs = contentDiv?.querySelectorAll('p');
    expect(paragraphs?.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

describe('Toast — icon', () => {
  it('renders icon when provided', () => {
    render(<Dark><Toast title="Info" icon={<svg data-testid="toast-icon" />} /></Dark>);
    expect(screen.getByTestId('toast-icon')).toBeInTheDocument();
  });

  it('does not render icon wrapper when not provided', () => {
    const { container } = render(<Dark><Toast title="Info" /></Dark>);
    // First child of the alert is the content div, no icon span
    const alert = container.querySelector('[role="alert"]')!;
    const firstChild = alert.firstElementChild!;
    expect(firstChild.tagName).toBe('DIV'); // content div, not span
  });
});

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

describe('Toast — action', () => {
  it('renders action element', () => {
    render(<Dark><Toast title="Update" action={<button data-testid="action">Update</button>} /></Dark>);
    expect(screen.getByTestId('action')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Dismiss
// ---------------------------------------------------------------------------

describe('Toast — dismiss', () => {
  it('renders dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(<Dark><Toast title="Test" onDismiss={onDismiss} /></Dark>);
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Dark><Toast title="Test" onDismiss={onDismiss} /></Dark>);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render dismiss button when dismissible is false', () => {
    const onDismiss = vi.fn();
    render(<Dark><Toast title="Test" onDismiss={onDismiss} dismissible={false} /></Dark>);
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<Dark><Toast title="Test" /></Dark>);
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('Toast — variants', () => {
  toastVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      render(<Dark><Toast variant={variant} title={`Toast ${variant}`} /></Dark>);
      expect(screen.getByText(`Toast ${variant}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className and style
// ---------------------------------------------------------------------------

describe('Toast — className and style', () => {
  it('passes className through', () => {
    render(<Dark><Toast title="Test" className="custom" /></Dark>);
    expect(screen.getByRole('alert')).toHaveClass('custom');
  });

  it('merges user style', () => {
    render(<Dark><Toast title="Test" style={{ marginTop: 44 }} /></Dark>);
    expect(screen.getByRole('alert').style.marginTop).toBe('44px');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Toast — ref forwarding', () => {
  it('forwards ref to wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Dark><Toast ref={ref} title="Test" /></Dark>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Toast — accessibility', () => {
  it('dismiss button has aria-label', () => {
    render(<Dark><Toast title="Test" onDismiss={() => {}} /></Dark>);
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('dismiss button is type="button"', () => {
    render(<Dark><Toast title="Test" onDismiss={() => {}} /></Dark>);
    expect(screen.getByLabelText('Dismiss')).toHaveAttribute('type', 'button');
  });
});
