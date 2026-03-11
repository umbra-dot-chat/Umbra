/**
 * MessageContextMenu — Stories showing all usage patterns.
 *
 * @module stories/message-context-menu
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MessageContextMenu } from './MessageContextMenu';

const meta: Meta<typeof MessageContextMenu> = {
  title: 'Components/Community/MessageContextMenu',
  component: MessageContextMenu,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MessageContextMenu>;

// ---------------------------------------------------------------------------
// Default (other user's message)
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <MessageContextMenu
      onReply={() => console.log('reply')}
      onCopyText={() => console.log('copy text')}
      onCopyLink={() => console.log('copy link')}
      onForward={() => console.log('forward')}
      onReact={() => console.log('react')}
      onCreateThread={() => console.log('create thread')}
      onDeleteForMe={() => console.log('delete for me')}
    >
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#27272a',
          color: '#fafafa',
          display: 'inline-block',
          cursor: 'context-menu',
        }}
      >
        Right-click me (other user's message)
      </div>
    </MessageContextMenu>
  ),
};

// ---------------------------------------------------------------------------
// Own Message
// ---------------------------------------------------------------------------

export const OwnMessage: Story = {
  name: 'Own Message',
  render: () => (
    <MessageContextMenu
      isOwn
      canDelete
      canPin
      onReply={() => console.log('reply')}
      onEdit={() => console.log('edit')}
      onDelete={() => console.log('delete')}
      onDeleteForMe={() => console.log('delete for me')}
      onPin={() => console.log('pin')}
      onCopyText={() => console.log('copy text')}
      onCopyLink={() => console.log('copy link')}
      onForward={() => console.log('forward')}
      onReact={() => console.log('react')}
      onCreateThread={() => console.log('create thread')}
    >
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#3f3f46',
          color: '#fafafa',
          display: 'inline-block',
          cursor: 'context-menu',
        }}
      >
        Right-click me (own message)
      </div>
    </MessageContextMenu>
  ),
};

// ---------------------------------------------------------------------------
// Pinned Message
// ---------------------------------------------------------------------------

export const PinnedMessage: Story = {
  name: 'Pinned Message',
  render: () => (
    <MessageContextMenu
      canPin
      isPinned
      onReply={() => console.log('reply')}
      onUnpin={() => console.log('unpin')}
      onCopyText={() => console.log('copy text')}
    >
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#27272a',
          color: '#fafafa',
          display: 'inline-block',
          cursor: 'context-menu',
        }}
      >
        Right-click me (pinned message)
      </div>
    </MessageContextMenu>
  ),
};

// ---------------------------------------------------------------------------
// Minimal Actions
// ---------------------------------------------------------------------------

export const MinimalActions: Story = {
  name: 'Minimal Actions',
  render: () => (
    <MessageContextMenu
      onReply={() => console.log('reply')}
      onCopyText={() => console.log('copy text')}
    >
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#27272a',
          color: '#fafafa',
          display: 'inline-block',
          cursor: 'context-menu',
        }}
      >
        Right-click me (minimal)
      </div>
    </MessageContextMenu>
  ),
};
