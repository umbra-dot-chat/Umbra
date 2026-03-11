import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NewMessageDivider, ChatBubble } from '@wisp-ui/react-native';

const meta: Meta<typeof NewMessageDivider> = {
  title: 'React Native/Components/Chat/NewMessageDivider',
  component: NewMessageDivider,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    color: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof NewMessageDivider>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {},
};

// ---------------------------------------------------------------------------
// Custom Label
// ---------------------------------------------------------------------------

export const CustomLabel: Story = {
  name: 'Custom Label',
  args: {
    label: '3 new messages',
  },
};

// ---------------------------------------------------------------------------
// Custom Color
// ---------------------------------------------------------------------------

export const CustomColor: Story = {
  name: 'Custom Color',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <NewMessageDivider />
      <NewMessageDivider label="New" color="#6366f1" />
      <NewMessageDivider label="New" color="#22c55e" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// In Conversation
// ---------------------------------------------------------------------------

export const InConversation: Story = {
  name: 'In Conversation',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
      <ChatBubble align="incoming" timestamp="Yesterday">
        Let me know when the PR is ready for review.
      </ChatBubble>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ChatBubble align="outgoing" variant="accent" timestamp="Yesterday" status="read">
          Will do!
        </ChatBubble>
      </div>

      <div style={{ paddingTop: 8, paddingBottom: 8 }}>
        <NewMessageDivider label="2 new messages" />
      </div>

      <ChatBubble align="incoming" timestamp="10:15 AM">
        Hey, the PR is approved! Great work.
      </ChatBubble>
      <ChatBubble align="incoming" timestamp="10:16 AM">
        I left one small comment but nothing blocking.
      </ChatBubble>
    </div>
  ),
};
