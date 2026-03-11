/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdvancedSearchPanel } from './AdvancedSearchPanel';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const emptyFilters = {};

function renderPanel(props: Record<string, unknown> = {}) {
  const defaultProps = {
    filters: emptyFilters,
    onFiltersChange: vi.fn(),
  };
  return render(
    <Dark>
      <AdvancedSearchPanel {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('AdvancedSearchPanel -- rendering', () => {
  it('renders with default title', () => {
    renderPanel();
    expect(screen.getByText('Advanced Search')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderPanel({ title: 'Find Messages' });
    expect(screen.getByText('Find Messages')).toBeInTheDocument();
  });

  it('renders search query input', () => {
    renderPanel();
    expect(screen.getByPlaceholderText('Enter search terms...')).toBeInTheDocument();
  });

  it('renders from user input', () => {
    renderPanel();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  });

  it('renders toggle labels', () => {
    renderPanel();
    expect(screen.getByText('Has file')).toBeInTheDocument();
    expect(screen.getByText('Has reaction')).toBeInTheDocument();
    expect(screen.getByText('Is pinned')).toBeInTheDocument();
  });

  it('renders result count when provided', () => {
    renderPanel({ resultCount: 42 });
    expect(screen.getByTestId('result-count')).toHaveTextContent('42 results');
  });

  it('renders singular result count', () => {
    renderPanel({ resultCount: 1 });
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 result');
  });
});

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

describe('AdvancedSearchPanel -- buttons', () => {
  it('renders Search button when onSearch is provided', () => {
    renderPanel({ onSearch: vi.fn() });
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders Reset button when onReset is provided', () => {
    renderPanel({ onReset: vi.fn() });
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('calls onSearch when Search button is clicked', () => {
    const onSearch = vi.fn();
    renderPanel({ onSearch });
    fireEvent.click(screen.getByText('Search'));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when Reset button is clicked', () => {
    const onReset = vi.fn();
    renderPanel({ onReset });
    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Filter changes
// ---------------------------------------------------------------------------

describe('AdvancedSearchPanel -- filter changes', () => {
  it('calls onFiltersChange when query input changes', () => {
    const onFiltersChange = vi.fn();
    renderPanel({ onFiltersChange });
    fireEvent.change(screen.getByPlaceholderText('Enter search terms...'), {
      target: { value: 'hello' },
    });
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'hello' }),
    );
  });
});

// ---------------------------------------------------------------------------
// Channels select
// ---------------------------------------------------------------------------

describe('AdvancedSearchPanel -- channels', () => {
  it('renders channel select when channels are provided', () => {
    renderPanel({
      channels: [
        { id: '1', name: 'general' },
        { id: '2', name: 'random' },
      ],
    });
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('random')).toBeInTheDocument();
  });
});
