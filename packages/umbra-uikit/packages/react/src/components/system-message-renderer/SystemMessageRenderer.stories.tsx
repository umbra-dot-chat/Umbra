/**
 * SystemMessageRenderer — Stories showing all message types and usage.
 *
 * @module stories/system-message-renderer
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SystemMessageRenderer } from './SystemMessageRenderer';

const meta: Meta<typeof SystemMessageRenderer> = {
  title: 'Components/Community/SystemMessageRenderer',
  component: SystemMessageRenderer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SystemMessageRenderer>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    content: 'Alice joined the channel',
    type: 'join',
    timestamp: '2:34 PM',
  },
};

// ---------------------------------------------------------------------------
// All Types
// ---------------------------------------------------------------------------

export const AllTypes: Story = {
  name: 'All Types',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 560 }}>
      <SystemMessageRenderer type="join" content="Alice joined the channel" timestamp="2:30 PM" />
      <SystemMessageRenderer type="leave" content="Bob left the channel" timestamp="2:31 PM" />
      <SystemMessageRenderer type="pin" content="Charlie pinned a message" timestamp="2:32 PM" />
      <SystemMessageRenderer type="channel_update" content="Channel name changed to #announcements" timestamp="2:33 PM" />
      <SystemMessageRenderer type="role_update" content="Dave was promoted to moderator" timestamp="2:34 PM" />
      <SystemMessageRenderer type="generic" content="This is a generic system message" timestamp="2:35 PM" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Without Timestamp
// ---------------------------------------------------------------------------

export const WithoutTimestamp: Story = {
  name: 'Without Timestamp',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 560 }}>
      <SystemMessageRenderer type="join" content="Alice joined the channel" />
      <SystemMessageRenderer type="leave" content="Bob left the channel" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Custom Icon
// ---------------------------------------------------------------------------

export const CustomIcon: Story = {
  name: 'Custom Icon',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <SystemMessageRenderer
        content="Custom system event"
        timestamp="3:00 PM"
        icon={<span style={{ fontSize: 12 }}>{'🔔'}</span>}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// In Chat Context
// ---------------------------------------------------------------------------

export const InChatContext: Story = {
  name: 'In Chat Context',
  render: () => (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#27272a',
          color: '#fafafa',
          fontSize: 14,
          width: 'fit-content',
        }}
      >
        Hey everyone!
      </div>

      <SystemMessageRenderer type="join" content="Alice joined the channel" timestamp="2:30 PM" />

      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#27272a',
          color: '#fafafa',
          fontSize: 14,
          width: 'fit-content',
        }}
      >
        Welcome, Alice!
      </div>

      <SystemMessageRenderer type="pin" content="Bob pinned a message" timestamp="2:32 PM" />
    </div>
  ),
};
