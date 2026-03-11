/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { MessageSearch } from './MessageSearch';
import type { SearchResult, SearchFilter } from '@coexist/wisp-core/types/MessageSearch.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseResults: SearchResult[] = [
  {
    id: 'r1',
    sender: 'Alice',
    content: 'Hey, how are you?',
    timestamp: '2:34 PM',
    channelName: 'general',
  },
  {
    id: 'r2',
    sender: 'Bob',
    content: 'The meeting starts at 3.',
    timestamp: '3:00 PM',
  },
];

const baseFilters: SearchFilter[] = [
  { type: 'from', value: 'Alice' },
  { type: 'in', value: '#general' },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('MessageSearch — rendering', () => {
  it('renders the search input', () => {
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(screen.getByLabelText('Search messages')).toBeInTheDocument();
  });

  it('renders the search input with the provided query value', () => {
    render(
      <Dark>
        <MessageSearch query="hello" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    const input = screen.getByLabelText('Search messages') as HTMLInputElement;
    expect(input.value).toBe('hello');
  });

  it('renders default placeholder text', () => {
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    const input = screen.getByPlaceholderText('Search messages...');
    expect(input).toBeInTheDocument();
  });

  it('renders custom placeholder text', () => {
    render(
      <Dark>
        <MessageSearch
          query=""
          onQueryChange={vi.fn()}
          results={[]}
          placeholder="Find something..."
        />
      </Dark>,
    );
    expect(screen.getByPlaceholderText('Find something...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('MessageSearch — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MessageSearch ref={ref} query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('MessageSearch — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <MessageSearch
          query=""
          onQueryChange={vi.fn()}
          results={[]}
          className="custom-search"
        />
      </Dark>,
    );
    expect(container.querySelector('.custom-search')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('MessageSearch — style merge', () => {
  it('merges user style onto the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MessageSearch
          ref={ref}
          query=""
          onQueryChange={vi.fn()}
          results={[]}
          style={{ marginTop: 10 }}
        />
      </Dark>,
    );
    expect(ref.current!.style.marginTop).toBe('10px');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('MessageSearch — accessibility', () => {
  it('has role="complementary" on the root element', () => {
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('has aria-label "Message search"', () => {
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(screen.getByLabelText('Message search')).toBeInTheDocument();
  });

  it('has a search role on the header', () => {
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(screen.getByRole('search')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Search input change
// ---------------------------------------------------------------------------

describe('MessageSearch — input change', () => {
  it('calls onQueryChange when typing in the input', () => {
    const onQueryChange = vi.fn();
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={onQueryChange} results={[]} />
      </Dark>,
    );
    const input = screen.getByLabelText('Search messages');
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(onQueryChange).toHaveBeenCalledWith('test query');
  });
});

// ---------------------------------------------------------------------------
// Filter pills
// ---------------------------------------------------------------------------

describe('MessageSearch — filter pills', () => {
  it('renders filter pills when filters are provided', () => {
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
          filters={baseFilters}
        />
      </Dark>,
    );
    expect(screen.getByText(/from: Alice/)).toBeInTheDocument();
    expect(screen.getByText(/in: #general/)).toBeInTheDocument();
  });

  it('fires onFilterRemove when a filter remove button is clicked', () => {
    const onFilterRemove = vi.fn();
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
          filters={baseFilters}
          onFilterRemove={onFilterRemove}
        />
      </Dark>,
    );
    const removeBtn = screen.getByLabelText('Remove from filter');
    fireEvent.click(removeBtn);
    expect(onFilterRemove).toHaveBeenCalledTimes(1);
    expect(onFilterRemove).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'from', value: 'Alice' }),
    );
  });

  it('does not render filter pills when no filters are provided', () => {
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(screen.queryByText(/from:/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Result list
// ---------------------------------------------------------------------------

describe('MessageSearch — result list', () => {
  it('renders result items with sender and content', () => {
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
        />
      </Dark>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('The meeting starts at 3.')).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
        />
      </Dark>,
    );
    expect(screen.getByText('2:34 PM')).toBeInTheDocument();
    expect(screen.getByText('3:00 PM')).toBeInTheDocument();
  });

  it('renders channel name when provided', () => {
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
        />
      </Dark>,
    );
    expect(screen.getByText('#general')).toBeInTheDocument();
  });

  it('renders result count', () => {
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
        />
      </Dark>,
    );
    expect(screen.getByText('2 results found')).toBeInTheDocument();
  });

  it('renders "1 result" singular when only one result', () => {
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={[baseResults[0]]}
        />
      </Dark>,
    );
    expect(screen.getByText('1 result found')).toBeInTheDocument();
  });

  it('uses totalResults for count when provided', () => {
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
          totalResults={42}
        />
      </Dark>,
    );
    expect(screen.getByText('42 results found')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Result click
// ---------------------------------------------------------------------------

describe('MessageSearch — result click', () => {
  it('fires onResultClick when a result is clicked', () => {
    const onResultClick = vi.fn();
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
          onResultClick={onResultClick}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Hey, how are you?'));
    expect(onResultClick).toHaveBeenCalledTimes(1);
    expect(onResultClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1', sender: 'Alice' }),
    );
  });

  it('responds to keyboard Enter on a result item', () => {
    const onResultClick = vi.fn();
    render(
      <Dark>
        <MessageSearch
          query="hello"
          onQueryChange={vi.fn()}
          results={baseResults}
          onResultClick={onResultClick}
        />
      </Dark>,
    );
    const resultItem = screen.getByText('Hey, how are you?').closest('[role="button"]')!;
    fireEvent.keyDown(resultItem, { key: 'Enter' });
    expect(onResultClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('MessageSearch — empty state', () => {
  it('shows empty state when query has text but no results', () => {
    render(
      <Dark>
        <MessageSearch
          query="nonexistent"
          onQueryChange={vi.fn()}
          results={[]}
        />
      </Dark>,
    );
    expect(screen.getByText(/No results found/)).toBeInTheDocument();
  });

  it('does not show empty state when query is empty', () => {
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(screen.queryByText(/No results found/)).not.toBeInTheDocument();
  });

  it('does not show empty state when query is whitespace-only', () => {
    render(
      <Dark>
        <MessageSearch query="   " onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(screen.queryByText(/No results found/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('MessageSearch — loading state', () => {
  it('shows loading text when loading is true', () => {
    render(
      <Dark>
        <MessageSearch
          query="test"
          onQueryChange={vi.fn()}
          results={[]}
          loading
        />
      </Dark>,
    );
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('does not show results or empty state while loading', () => {
    render(
      <Dark>
        <MessageSearch
          query="test"
          onQueryChange={vi.fn()}
          results={[]}
          loading
        />
      </Dark>,
    );
    expect(screen.queryByText(/No results found/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

describe('MessageSearch — close button', () => {
  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <MessageSearch
          query=""
          onQueryChange={vi.fn()}
          results={[]}
          onClose={onClose}
        />
      </Dark>,
    );
    const closeBtn = screen.getByLabelText('Close search');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is not provided', () => {
    render(
      <Dark>
        <MessageSearch query="" onQueryChange={vi.fn()} results={[]} />
      </Dark>,
    );
    expect(screen.queryByLabelText('Close search')).not.toBeInTheDocument();
  });
});
