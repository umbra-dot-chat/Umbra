/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThreadListView } from './ThreadListView';
import type { ThreadListItem } from '@coexist/wisp-core/types/ThreadListView.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockThreads: ThreadListItem[] = [
  {
    id: 't1',
    parentSender: 'Alice',
    parentPreview: 'Hey, has anyone seen the latest design?',
    replyCount: 5,
    lastActivityAt: '2 min ago',
    hasUnread: true,
    isFollowing: true,
  },
  {
    id: 't2',
    parentSender: 'Bob',
    parentPreview: 'We need to refactor the auth module',
    replyCount: 12,
    lastActivityAt: '1 hour ago',
    hasUnread: false,
    isFollowing: false,
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ThreadListView — rendering', () => {
  it('renders thread list with title', () => {
    render(
      <Dark>
        <ThreadListView threads={mockThreads} />
      </Dark>,
    );
    expect(screen.getByText('Threads')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <Dark>
        <ThreadListView threads={mockThreads} title="Active Threads" />
      </Dark>,
    );
    expect(screen.getByText('Active Threads')).toBeInTheDocument();
  });

  it('renders thread cards with sender names', () => {
    render(
      <Dark>
        <ThreadListView threads={mockThreads} />
      </Dark>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders reply counts', () => {
    render(
      <Dark>
        <ThreadListView threads={mockThreads} />
      </Dark>,
    );
    expect(screen.getByText('5 replies')).toBeInTheDocument();
    expect(screen.getByText('12 replies')).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(
      <Dark>
        <ThreadListView threads={mockThreads} />
      </Dark>,
    );
    expect(screen.getByText('2 min ago')).toBeInTheDocument();
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('ThreadListView — empty state', () => {
  it('shows empty text when no threads', () => {
    render(
      <Dark>
        <ThreadListView threads={[]} />
      </Dark>,
    );
    expect(screen.getByText('No threads yet')).toBeInTheDocument();
  });

  it('shows custom empty text', () => {
    render(
      <Dark>
        <ThreadListView threads={[]} emptyText="Nothing here" />
      </Dark>,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('ThreadListView — loading', () => {
  it('shows loading text when loading with no threads', () => {
    render(
      <Dark>
        <ThreadListView threads={[]} loading />
      </Dark>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton state
// ---------------------------------------------------------------------------

describe('ThreadListView — skeleton', () => {
  it('renders skeleton cards when skeleton is true', () => {
    const { container } = render(
      <Dark>
        <ThreadListView threads={[]} skeleton />
      </Dark>,
    );
    // Title should still be visible
    expect(screen.getByText('Threads')).toBeInTheDocument();
    // Should have aria-hidden skeleton elements
    const hiddenEls = container.querySelectorAll('[aria-hidden]');
    expect(hiddenEls.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('ThreadListView — interactions', () => {
  it('calls onThreadClick when a thread card is clicked', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <ThreadListView threads={mockThreads} onThreadClick={handleClick} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Alice'));
    expect(handleClick).toHaveBeenCalledWith('t1');
  });

  it('calls onFollowToggle when follow button is clicked', () => {
    const handleFollow = vi.fn();
    render(
      <Dark>
        <ThreadListView threads={mockThreads} onFollowToggle={handleFollow} />
      </Dark>,
    );
    const followButtons = screen.getAllByLabelText(/Follow thread|Unfollow thread/);
    fireEvent.click(followButtons[1]); // Click "Follow" on second thread
    expect(handleFollow).toHaveBeenCalledWith('t2');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Dark>
        <ThreadListView threads={mockThreads} onClose={handleClose} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Close threads panel'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('ThreadListView — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ThreadListView ref={ref} threads={mockThreads} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
