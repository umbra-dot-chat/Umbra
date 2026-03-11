/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageContextMenu } from './MessageContextMenu';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const noop = () => {};

function openMenu() {
  fireEvent.contextMenu(screen.getByText('Hello'));
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('MessageContextMenu — rendering', () => {
  it('renders children (trigger element)', () => {
    render(
      <Dark>
        <MessageContextMenu onReply={noop} onCopyText={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows Reply item on right-click', () => {
    render(
      <Dark>
        <MessageContextMenu onReply={noop} onCopyText={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Own message actions
// ---------------------------------------------------------------------------

describe('MessageContextMenu — own messages', () => {
  it('shows Edit when isOwn and onEdit is provided', () => {
    render(
      <Dark>
        <MessageContextMenu isOwn onEdit={noop} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('hides Edit when not own message', () => {
    render(
      <Dark>
        <MessageContextMenu isOwn={false} onEdit={noop} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Delete permissions
// ---------------------------------------------------------------------------

describe('MessageContextMenu — delete', () => {
  it('shows Delete when canDelete is true', () => {
    render(
      <Dark>
        <MessageContextMenu canDelete onDelete={noop} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('hides Delete when canDelete is false', () => {
    render(
      <Dark>
        <MessageContextMenu canDelete={false} onDelete={noop} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Pin / Unpin
// ---------------------------------------------------------------------------

describe('MessageContextMenu — pin', () => {
  it('shows Pin Message when canPin and not pinned', () => {
    render(
      <Dark>
        <MessageContextMenu canPin isPinned={false} onPin={noop} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    expect(screen.getByText('Pin Message')).toBeInTheDocument();
  });

  it('shows Unpin Message when canPin and already pinned', () => {
    render(
      <Dark>
        <MessageContextMenu canPin isPinned onUnpin={noop} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    expect(screen.getByText('Unpin Message')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Callbacks
// ---------------------------------------------------------------------------

describe('MessageContextMenu — callbacks', () => {
  it('calls onReply when Reply is clicked', () => {
    const onReply = vi.fn();
    render(
      <Dark>
        <MessageContextMenu onReply={onReply}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    fireEvent.click(screen.getByText('Reply'));
    expect(onReply).toHaveBeenCalledOnce();
  });

  it('calls onCopyText when Copy Text is clicked', () => {
    const onCopyText = vi.fn();
    render(
      <Dark>
        <MessageContextMenu onCopyText={onCopyText} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    fireEvent.click(screen.getByText('Copy Text'));
    expect(onCopyText).toHaveBeenCalledOnce();
  });

  it('calls onDelete when Delete is clicked', () => {
    const onDelete = vi.fn();
    render(
      <Dark>
        <MessageContextMenu canDelete onDelete={onDelete} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('calls onForward when Forward is clicked', () => {
    const onForward = vi.fn();
    render(
      <Dark>
        <MessageContextMenu onForward={onForward} onReply={noop}>
          <div>Hello</div>
        </MessageContextMenu>
      </Dark>,
    );
    openMenu();
    fireEvent.click(screen.getByText('Forward'));
    expect(onForward).toHaveBeenCalledOnce();
  });
});
