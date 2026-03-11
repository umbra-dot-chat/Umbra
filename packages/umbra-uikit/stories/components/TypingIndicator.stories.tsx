import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TypingIndicator, ChatBubble, MessageGroup, Avatar } from '@wisp-ui/react';
import { typingIndicatorAnimations } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

const meta: Meta<typeof TypingIndicator> = {
  title: 'React/Components/Chat/TypingIndicator',
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
          <SectionLabel>{animation}</SectionLabel>
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
        <SectionLabel>Bare dots</SectionLabel>
        <TypingIndicator />
      </div>
      <div>
        <SectionLabel>In a bubble</SectionLabel>
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
        <SectionLabel>Default size (8px)</SectionLabel>
        <TypingIndicator bubble />
      </div>
      <div>
        <SectionLabel>Large dots (12px)</SectionLabel>
        <TypingIndicator bubble dotSize={12} />
      </div>
      <div>
        <SectionLabel>Custom color</SectionLabel>
        <TypingIndicator bubble color="#6366f1" />
      </div>
    </div>
  ),
};
