/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from './EmptyState';
import { emptyStateSizes } from '@coexist/wisp-core/types/EmptyState.types';
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

describe('EmptyState — rendering', () => {
  it('renders title text', () => {
    render(<Dark><EmptyState title="No results" /></Dark>);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('renders title as an h3 element', () => {
    render(<Dark><EmptyState title="No results" /></Dark>);
    expect(screen.getByText('No results').tagName).toBe('H3');
  });

  it('renders a wrapper div', () => {
    const { container } = render(<Dark><EmptyState title="Empty" /></Dark>);
    expect(container.firstChild!.nodeName).toBe('DIV');
  });
});

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

describe('EmptyState — description', () => {
  it('renders description text', () => {
    render(<Dark><EmptyState title="No items" description="Try adding something" /></Dark>);
    expect(screen.getByText('Try adding something')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<Dark><EmptyState title="Empty" /></Dark>);
    expect(container.querySelector('p')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

describe('EmptyState — icon', () => {
  it('renders icon when provided', () => {
    const icon = <svg data-testid="mock-icon" />;
    render(<Dark><EmptyState title="Empty" icon={icon} /></Dark>);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('does not render icon wrapper when not provided', () => {
    const { container } = render(<Dark><EmptyState title="Empty" /></Dark>);
    // Only the container div, h3, and possibly p
    const children = Array.from((container.firstChild as HTMLElement).children);
    expect(children[0].tagName).toBe('H3');
  });
});

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

describe('EmptyState — action', () => {
  it('renders action element', () => {
    const action = <button data-testid="action-btn">Create</button>;
    render(<Dark><EmptyState title="Empty" action={action} /></Dark>);
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('does not render action wrapper when not provided', () => {
    render(<Dark><EmptyState title="Empty" /></Dark>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('EmptyState — sizes', () => {
  emptyStateSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><EmptyState size={size} title={`Size ${size}`} /></Dark>);
      expect(screen.getByText(`Size ${size}`)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className and style
// ---------------------------------------------------------------------------

describe('EmptyState — className and style', () => {
  it('passes className through', () => {
    const { container } = render(<Dark><EmptyState title="Empty" className="custom" /></Dark>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('merges user style', () => {
    const { container } = render(<Dark><EmptyState title="Empty" style={{ marginTop: 77 }} /></Dark>);
    expect((container.firstChild as HTMLElement).style.marginTop).toBe('77px');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('EmptyState — ref forwarding', () => {
  it('forwards ref to wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Dark><EmptyState ref={ref} title="Empty" /></Dark>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// All slots combined
// ---------------------------------------------------------------------------

describe('EmptyState — all slots', () => {
  it('renders icon, title, description, and action together', () => {
    render(
      <Dark>
        <EmptyState
          icon={<svg data-testid="icon" />}
          title="No data"
          description="Nothing to show"
          action={<button data-testid="btn">Refresh</button>}
        />
      </Dark>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
    expect(screen.getByTestId('btn')).toBeInTheDocument();
  });
});
