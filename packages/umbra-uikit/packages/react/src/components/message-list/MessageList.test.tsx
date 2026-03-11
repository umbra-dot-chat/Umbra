/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageList } from './MessageList';
import { WispProvider } from '../../providers';
import type { MessageListEntry } from '@coexist/wisp-core/types/MessageList.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseMessages: MessageListEntry[] = [
  {
    type: 'message',
    id: '1',
    sender: 'Alice',
    content: 'Hello there!',
    timestamp: '2:30 PM',
  },
  {
    type: 'message',
    id: '2',
    sender: 'Alice',
    content: 'How are you?',
    timestamp: '2:31 PM',
  },
  {
    type: 'message',
    id: '3',
    sender: 'Bob',
    content: 'Doing great!',
    timestamp: '2:32 PM',
    isOwn: true,
  },
];

const entriesWithSeparator: MessageListEntry[] = [
  { type: 'separator', label: 'Today' },
  ...baseMessages,
];

const entriesWithNewMessages: MessageListEntry[] = [
  {
    type: 'message',
    id: '1',
    sender: 'Alice',
    content: 'Old message',
    timestamp: '1:00 PM',
  },
  { type: 'new-messages', label: 'New Messages' },
  {
    type: 'message',
    id: '2',
    sender: 'Alice',
    content: 'New message',
    timestamp: '2:00 PM',
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('MessageList -- rendering', () => {
  it('renders messages', () => {
    render(
      <Dark>
        <MessageList entries={baseMessages} />
      </Dark>,
    );
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
    expect(screen.getByText('Doing great!')).toBeInTheDocument();
  });

  it('renders day separators', () => {
    render(
      <Dark>
        <MessageList entries={entriesWithSeparator} />
      </Dark>,
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByTestId('day-separator')).toBeInTheDocument();
  });

  it('renders new message divider', () => {
    render(
      <Dark>
        <MessageList entries={entriesWithNewMessages} />
      </Dark>,
    );
    expect(screen.getByText('New Messages')).toBeInTheDocument();
    expect(screen.getByTestId('new-message-divider')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('MessageList -- empty state', () => {
  it('shows default empty text when no entries', () => {
    render(
      <Dark>
        <MessageList entries={[]} />
      </Dark>,
    );
    expect(screen.getByTestId('message-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('renders custom empty content', () => {
    render(
      <Dark>
        <MessageList entries={[]} emptyContent={<div>Start chatting!</div>} />
      </Dark>,
    );
    expect(screen.getByText('Start chatting!')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('MessageList -- loading', () => {
  it('shows loading spinner when loadingMore is true', () => {
    render(
      <Dark>
        <MessageList entries={baseMessages} loadingMore hasMore />
      </Dark>,
    );
    expect(screen.getByTestId('loading-more')).toBeInTheDocument();
  });

  it('renders sentinel when hasMore is true', () => {
    render(
      <Dark>
        <MessageList entries={baseMessages} hasMore />
      </Dark>,
    );
    expect(screen.getByTestId('load-more-sentinel')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

describe('MessageList -- grouping', () => {
  it('groups consecutive messages from the same sender', () => {
    const entries: MessageListEntry[] = [
      { type: 'message', id: '1', sender: 'Alice', content: 'Msg 1', timestamp: '1:00 PM' },
      { type: 'message', id: '2', sender: 'Alice', content: 'Msg 2', timestamp: '1:01 PM' },
      { type: 'message', id: '3', sender: 'Bob', content: 'Msg 3', timestamp: '1:02 PM', isOwn: true },
    ];

    render(
      <Dark>
        <MessageList entries={entries} />
      </Dark>,
    );

    // Both messages from Alice should be rendered
    expect(screen.getByText('Msg 1')).toBeInTheDocument();
    expect(screen.getByText('Msg 2')).toBeInTheDocument();
    expect(screen.getByText('Msg 3')).toBeInTheDocument();

    // Alice's name should appear once (as a group sender)
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('MessageList -- skeleton', () => {
  it('renders skeleton when skeleton prop is true', () => {
    const { container } = render(
      <Dark>
        <MessageList entries={[]} skeleton />
      </Dark>,
    );
    // Skeleton should render placeholder divs, not the empty state
    expect(screen.queryByTestId('message-list-empty')).not.toBeInTheDocument();
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('MessageList -- ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MessageList ref={ref} entries={baseMessages} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('MessageList -- className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <MessageList entries={baseMessages} className="custom-list" />
      </Dark>,
    );
    expect(container.querySelector('.custom-list')).toBeInTheDocument();
  });
});
