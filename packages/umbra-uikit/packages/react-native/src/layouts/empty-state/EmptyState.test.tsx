/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from './EmptyState';
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

describe('EmptyState — rendering', () => {
  it('renders title text', () => {
    render(
      <Wrapper>
        <EmptyState title="No items found" />
      </Wrapper>,
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <Wrapper>
        <EmptyState
          title="No items found"
          description="Try adjusting your filters"
        />
      </Wrapper>,
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    render(
      <Wrapper>
        <EmptyState title="Empty" />
      </Wrapper>,
    );
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <Wrapper>
        <EmptyState
          title="No results"
          icon={<span data-testid="empty-icon">icon</span>}
        />
      </Wrapper>,
    );
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(
      <Wrapper>
        <EmptyState
          title="No results"
          action={<button data-testid="action-btn">Retry</button>}
        />
      </Wrapper>,
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });
});
