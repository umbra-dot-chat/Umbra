import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TypingIndicator, ChatBubble, MessageGroup, Avatar } from '@wisp-ui/react-native';
import { typingIndicatorAnimations } from '@wisp-ui/core/types/TypingIndicator.types';

const meta: Meta<typeof TypingIndicator> = {
  title: 'React Native/Components/Chat/TypingIndicator',
  component: TypingIndicator,
  tags: ['autodocs'],
  argTypes: {
    animation: { control: 'select', options: [...typingIndicatorAnimations] },
    bubble: { control: 'boolean' },
    align: { control: 'select', options: ['incoming', 'outgoing'] },
    sender: { control: 'text' },
    color: { control: 'color' },
    dotSize: { control: { type: 'range', min: 4, max: 16, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof TypingIndicator>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    bubble: true,
    animation: 'bounce',
  },
};

// ---------------------------------------------------------------------------
// Animation Styles
// ---------------------------------------------------------------------------

export const AnimationStyles: Story = {
  name: 'Animation Styles',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {typingIndicatorAnimations.map((animation) => (
        <div key={animation} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>{animation}</div>
          <TypingIndicator bubble animation={animation} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Bubble Mode
// ---------------------------------------------------------------------------

export const BubbleMode: Story = {
  name: 'Bubble Mode',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bare dots</div>
        <TypingIndicator />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>In a bubble</div>
        <TypingIndicator bubble />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Avatar & Sender
// ---------------------------------------------------------------------------

export const WithAvatarAndSender: Story = {
  name: 'With Avatar & Sender',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <TypingIndicator
        bubble
        sender="Alice"
        avatar={<Avatar name="Alice" size="sm" />}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// In Conversation
// ---------------------------------------------------------------------------

export const InConversation: Story = {
  name: 'In Conversation',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <MessageGroup
        align="incoming"
        sender="Alice"
        avatar={<Avatar name="Alice" size="sm" />}
        timestamp="2:30 PM"
      >
        <ChatBubble align="incoming">Hey! How&apos;s the project going?</ChatBubble>
      </MessageGroup>

      <MessageGroup
        align="outgoing"
        timestamp="2:31 PM"
        status="read"
      >
        <ChatBubble align="outgoing" variant="accent">Pretty good! Almost done with the chat components.</ChatBubble>
      </MessageGroup>

      <TypingIndicator
        bubble
        sender="Alice"
        avatar={<Avatar name="Alice" size="sm" />}
        animation="bounce"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Custom Color & Dot Size
// ---------------------------------------------------------------------------

export const CustomColorAndDotSize: Story = {
  name: 'Custom Color & Dot Size',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Default size (8px)</div>
        <TypingIndicator bubble />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Large dots (12px)</div>
        <TypingIndicator bubble dotSize={12} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Custom color</div>
        <TypingIndicator bubble color="#6366f1" />
      </div>
    </div>
  ),
};
