import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChatBubble, MessageGroup, Avatar } from '@wisp-ui/react';
import { chatBubbleAlignments, chatBubbleVariants, chatBubbleStatuses } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

const meta: Meta<typeof ChatBubble> = {
  title: 'React/Components/Chat/ChatBubble',
  component: ChatBubble,
  tags: ['autodocs'],
  argTypes: {
    align: { control: 'select', options: [...chatBubbleAlignments] },
    variant: { control: 'select', options: [...chatBubbleVariants] },
    status: { control: 'select', options: [undefined, ...chatBubbleStatuses] },
    timestamp: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ChatBubble>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'Hey! How are you doing?',
    align: 'incoming',
    variant: 'default',
  },
};

// ---------------------------------------------------------------------------
// Alignments
// ---------------------------------------------------------------------------

export const Alignments: Story = {
  name: 'Alignments',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <SectionLabel>Incoming (left)</SectionLabel>
      <ChatBubble align="incoming" timestamp="2:30 PM">
        Hey, are you free for a call later?
      </ChatBubble>

      <SectionLabel>Outgoing (right)</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ChatBubble align="outgoing" timestamp="2:31 PM" status="read">
          Sure! Let me finish this up first.
        </ChatBubble>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <SectionLabel>Default incoming</SectionLabel>
      <ChatBubble align="incoming">Default variant — theme surface colors</ChatBubble>

      <SectionLabel>Default outgoing</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ChatBubble align="outgoing">Default outgoing — raised surface</ChatBubble>
      </div>

      <SectionLabel>Accent outgoing</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ChatBubble align="outgoing" variant="accent">Accent variant — brand color</ChatBubble>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Timestamp & Status
// ---------------------------------------------------------------------------

export const TimestampAndStatus: Story = {
  name: 'Timestamp & Status',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      {chatBubbleStatuses.map((status) => (
        <div key={status} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ChatBubble align="outgoing" timestamp="2:34 PM" status={status}>
            Status: {status}
          </ChatBubble>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

export const Reactions: Story = {
  name: 'Reactions',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <ChatBubble
        align="incoming"
        timestamp="2:30 PM"
        reactions={[
          { emoji: '👍', count: 3, reacted: true },
          { emoji: '❤️', count: 1 },
        ]}
      >
        Check out this new feature!
      </ChatBubble>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ChatBubble
          align="outgoing"
          variant="accent"
          timestamp="2:31 PM"
          status="read"
          reactions={[{ emoji: '🔥', count: 2 }]}
        >
          That looks amazing!
        </ChatBubble>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

export const Conversation: Story = {
  name: 'Conversation',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
      <ChatBubble align="incoming" timestamp="2:30 PM">
        Hey! Are you coming to the team lunch?
      </ChatBubble>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ChatBubble align="outgoing" variant="accent" timestamp="2:31 PM" status="delivered">
          Yes! Where are we going?
        </ChatBubble>
      </div>
      <ChatBubble align="incoming" timestamp="2:32 PM">
        That new sushi place on 5th. Everyone&apos;s excited!
      </ChatBubble>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ChatBubble align="outgoing" variant="accent" timestamp="2:33 PM" status="read">
          Count me in 🍣
        </ChatBubble>
      </div>
    </div>
  ),
};
