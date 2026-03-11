import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MessageGroup, ChatBubble, Avatar } from '@wisp-ui/react-native';

const meta: Meta<typeof MessageGroup> = {
  title: 'React Native/Components/Chat/MessageGroup',
  component: MessageGroup,
  tags: ['autodocs'],
  argTypes: {
    align: { control: 'select', options: ['incoming', 'outgoing'] },
    sender: { control: 'text' },
    timestamp: { control: 'text' },
    status: { control: 'select', options: [undefined, 'sent', 'delivered', 'read'] },
  },
};

export default meta;
type Story = StoryObj<typeof MessageGroup>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <MessageGroup
        align="incoming"
        sender="Alice"
        avatar={<Avatar name="Alice" size="sm" />}
        timestamp="2:30 PM"
      >
        <ChatBubble align="incoming">Hey there!</ChatBubble>
        <ChatBubble align="incoming">How&apos;s the project going?</ChatBubble>
        <ChatBubble align="incoming">I was thinking we could ship it this week.</ChatBubble>
      </MessageGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Outgoing
// ---------------------------------------------------------------------------

export const Outgoing: Story = {
  name: 'Outgoing',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <MessageGroup
        align="outgoing"
        timestamp="2:31 PM"
        status="read"
      >
        <ChatBubble align="outgoing" variant="accent">Sounds good!</ChatBubble>
        <ChatBubble align="outgoing" variant="accent">Let me push the final changes tonight.</ChatBubble>
      </MessageGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

export const Conversation: Story = {
  name: 'Conversation',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <MessageGroup
        align="incoming"
        sender="Alice"
        avatar={<Avatar name="Alice" size="sm" />}
        timestamp="2:30 PM"
      >
        <ChatBubble align="incoming">Hey! Quick question about the design system.</ChatBubble>
        <ChatBubble align="incoming">Are we using 8px or 4px spacing for the chat components?</ChatBubble>
      </MessageGroup>

      <MessageGroup
        align="outgoing"
        timestamp="2:32 PM"
        status="read"
      >
        <ChatBubble align="outgoing" variant="accent">8px between groups, 4px between consecutive bubbles.</ChatBubble>
        <ChatBubble align="outgoing" variant="accent">I documented it in the Figma file.</ChatBubble>
        <ChatBubble align="outgoing" variant="accent">Check the &quot;Chat Patterns&quot; page.</ChatBubble>
      </MessageGroup>

      <MessageGroup
        align="incoming"
        sender="Alice"
        avatar={<Avatar name="Alice" size="sm" />}
        timestamp="2:33 PM"
      >
        <ChatBubble align="incoming">Perfect, thanks! 🎉</ChatBubble>
      </MessageGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Status
// ---------------------------------------------------------------------------

export const WithStatus: Story = {
  name: 'With Status',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Sent</div>
      <MessageGroup align="outgoing" timestamp="2:30 PM" status="sent">
        <ChatBubble align="outgoing" variant="accent">Just sent this.</ChatBubble>
      </MessageGroup>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Delivered</div>
      <MessageGroup align="outgoing" timestamp="2:31 PM" status="delivered">
        <ChatBubble align="outgoing" variant="accent">This was delivered.</ChatBubble>
      </MessageGroup>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Read</div>
      <MessageGroup align="outgoing" timestamp="2:32 PM" status="read">
        <ChatBubble align="outgoing" variant="accent">This has been read.</ChatBubble>
      </MessageGroup>
    </div>
  ),
};
