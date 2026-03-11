/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThreadIndicator } from './ThreadIndicator';
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

describe('ThreadIndicator — rendering', () => {
  it('renders reply count', () => {
    render(
      <Dark>
        <ThreadIndicator replyCount={5} />
      </Dark>,
    );
    expect(screen.getByText('5 replies')).toBeInTheDocument();
  });

  it('renders singular reply text for count of 1', () => {
    render(
      <Dark>
        <ThreadIndicator replyCount={1} />
      </Dark>,
    );
    expect(screen.getByText('1 reply')).toBeInTheDocument();
  });

  it('renders as a div element', () => {
    const { container } = render(
      <Dark>
        <ThreadIndicator replyCount={3} />
      </Dark>,
    );
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Avatars
// ---------------------------------------------------------------------------

describe('ThreadIndicator — avatars', () => {
  it('renders participant avatars (max 3)', () => {
    const avatars = [
      <span key="a" data-testid="avatar-1">A</span>,
      <span key="b" data-testid="avatar-2">B</span>,
      <span key="c" data-testid="avatar-3">C</span>,
      <span key="d" data-testid="avatar-4">D</span>,
    ];
    render(
      <Dark>
        <ThreadIndicator replyCount={10} participantAvatars={avatars} />
      </Dark>,
    );
    expect(screen.getByTestId('avatar-1')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-2')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-3')).toBeInTheDocument();
    expect(screen.queryByTestId('avatar-4')).not.toBeInTheDocument();
  });

  it('renders without avatars when none provided', () => {
    const { container } = render(
      <Dark>
        <ThreadIndicator replyCount={2} />
      </Dark>,
    );
    expect(container.querySelector('[data-testid="thread-reply-count"]')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Unread style
// ---------------------------------------------------------------------------

describe('ThreadIndicator — unread', () => {
  it('applies unread styling when hasUnread is true', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ThreadIndicator ref={ref} replyCount={3} hasUnread />
      </Dark>,
    );
    const replyCountEl = screen.getByTestId('thread-reply-count');
    expect(replyCountEl.style.fontWeight).toBe('600');
  });
});

// ---------------------------------------------------------------------------
// onClick
// ---------------------------------------------------------------------------

describe('ThreadIndicator — onClick', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <Dark>
        <ThreadIndicator replyCount={3} onClick={handleClick} />
      </Dark>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Timestamp
// ---------------------------------------------------------------------------

describe('ThreadIndicator — timestamp', () => {
  it('shows timestamp when provided', () => {
    render(
      <Dark>
        <ThreadIndicator replyCount={2} lastReplyAt="5 min ago" />
      </Dark>,
    );
    expect(screen.getByText('5 min ago')).toBeInTheDocument();
  });

  it('does not show timestamp when not provided', () => {
    render(
      <Dark>
        <ThreadIndicator replyCount={2} />
      </Dark>,
    );
    expect(screen.queryByTestId('thread-timestamp')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('ThreadIndicator — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ThreadIndicator ref={ref} replyCount={1} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
