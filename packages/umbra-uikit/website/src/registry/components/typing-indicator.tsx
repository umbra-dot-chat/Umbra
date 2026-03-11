import React from 'react';
import { TypingIndicator, Avatar, VStack, HStack, Text, ChatBubble, MessageGroup } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const typingIndicatorEntry: ComponentEntry = {
  slug: 'typing-indicator',
  name: 'TypingIndicator',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Animated typing indicator with bouncing, pulsing, scaling, or wave dot animations. Can render as bare dots or inside a chat-bubble-shaped container with optional avatar.',
  variantCount: 4,
  keywords: ['typing', 'indicator', 'dots', 'loading', 'chat', 'message', 'animation'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <TypingIndicator bubble align="incoming" />
    </div>
  ),

  examples: [
    {
      title: 'Animation Styles',
      render: (
        <VStack gap="lg" style={{ maxWidth: 400 }}>
          <HStack gap="lg" align="center">
            <Text size="xs" color="tertiary" style={{ width: 50 }}>bounce</Text>
            <TypingIndicator animation="bounce" />
          </HStack>
          <HStack gap="lg" align="center">
            <Text size="xs" color="tertiary" style={{ width: 50 }}>pulse</Text>
            <TypingIndicator animation="pulse" />
          </HStack>
          <HStack gap="lg" align="center">
            <Text size="xs" color="tertiary" style={{ width: 50 }}>scale</Text>
            <TypingIndicator animation="scale" />
          </HStack>
          <HStack gap="lg" align="center">
            <Text size="xs" color="tertiary" style={{ width: 50 }}>wave</Text>
            <TypingIndicator animation="wave" />
          </HStack>
        </VStack>
      ),
      code: `import { TypingIndicator } from '@wisp-ui/react';

<TypingIndicator animation="bounce" />
<TypingIndicator animation="pulse" />
<TypingIndicator animation="scale" />
<TypingIndicator animation="wave" />`,
      rnCode: `import { TypingIndicator } from '@wisp-ui/react-native';

<TypingIndicator animation="bounce" />
<TypingIndicator animation="pulse" />
<TypingIndicator animation="scale" />
<TypingIndicator animation="wave" />`,
    },
    {
      title: 'Bubble Mode',
      render: (
        <VStack gap="md" style={{ maxWidth: 400 }}>
          <TypingIndicator bubble align="incoming" />
          <TypingIndicator bubble align="incoming" animation="pulse" />
          <TypingIndicator bubble align="incoming" animation="wave" />
        </VStack>
      ),
      code: `<TypingIndicator bubble align="incoming" />
<TypingIndicator bubble animation="pulse" />
<TypingIndicator bubble animation="wave" />`,
      rnCode: `import { TypingIndicator } from '@wisp-ui/react-native';

<TypingIndicator bubble align="incoming" />
<TypingIndicator bubble animation="pulse" />
<TypingIndicator bubble animation="wave" />`,
    },
    {
      title: 'With Avatar & Sender',
      render: (
        <VStack gap="lg" style={{ maxWidth: 420 }}>
          <TypingIndicator
            bubble
            avatar={<Avatar name="Alice" size="sm" />}
            sender="Alice"
          />
          <TypingIndicator
            bubble
            animation="pulse"
            avatar={<Avatar name="Bob" size="sm" />}
            sender="Bob"
          />
        </VStack>
      ),
      code: `<TypingIndicator
  bubble
  avatar={<Avatar name="Alice" size="sm" />}
  sender="Alice"
/>`,
      rnCode: `import { TypingIndicator, Avatar } from '@wisp-ui/react-native';

<TypingIndicator
  bubble
  avatar={<Avatar name="Alice" size="sm" />}
  sender="Alice"
/>`,
    },
    {
      title: 'In Conversation',
      render: (
        <VStack gap="lg" style={{ maxWidth: 420 }}>
          <MessageGroup
            align="incoming"
            sender="Alice"
            avatar={<Avatar name="Alice" size="sm" />}
            timestamp="2:30 PM"
          >
            <ChatBubble align="incoming">
              Hey! Are you there?
            </ChatBubble>
          </MessageGroup>

          <MessageGroup align="outgoing" timestamp="2:31 PM" status="read">
            <ChatBubble align="outgoing" variant="accent">
              Yeah, give me a sec
            </ChatBubble>
          </MessageGroup>

          <TypingIndicator
            bubble
            avatar={<Avatar name="Alice" size="sm" />}
            sender="Alice"
          />
        </VStack>
      ),
      code: `<MessageGroup align="incoming" sender="Alice" timestamp="2:30 PM">
  <ChatBubble align="incoming">Hey! Are you there?</ChatBubble>
</MessageGroup>

<MessageGroup align="outgoing" timestamp="2:31 PM" status="read">
  <ChatBubble align="outgoing">Yeah, give me a sec</ChatBubble>
</MessageGroup>

<TypingIndicator
  bubble
  avatar={<Avatar name="Alice" size="sm" />}
  sender="Alice"
/>`,
      rnCode: `import { MessageGroup, ChatBubble, TypingIndicator, Avatar } from '@wisp-ui/react-native';

<MessageGroup align="incoming" sender="Alice" timestamp="2:30 PM">
  <ChatBubble align="incoming">Hey! Are you there?</ChatBubble>
</MessageGroup>

<MessageGroup align="outgoing" timestamp="2:31 PM" status="read">
  <ChatBubble align="outgoing">Yeah, give me a sec</ChatBubble>
</MessageGroup>

<TypingIndicator
  bubble
  avatar={<Avatar name="Alice" size="sm" />}
  sender="Alice"
/>`,
    },
    {
      title: 'Custom Color & Dot Size',
      render: (
        <VStack gap="md" style={{ maxWidth: 400 }}>
          <TypingIndicator color="#6366f1" dotSize={10} />
          <TypingIndicator color="#f59e0b" dotSize={6} animation="pulse" />
          <TypingIndicator bubble color="#22c55e" dotSize={10} animation="scale" />
        </VStack>
      ),
      code: `<TypingIndicator color="#6366f1" dotSize={10} />
<TypingIndicator color="#f59e0b" dotSize={6} animation="pulse" />
<TypingIndicator bubble color="#22c55e" dotSize={10} animation="scale" />`,
      rnCode: `import { TypingIndicator } from '@wisp-ui/react-native';

<TypingIndicator color="#6366f1" dotSize={10} />
<TypingIndicator color="#f59e0b" dotSize={6} animation="pulse" />
<TypingIndicator bubble color="#22c55e" dotSize={10} animation="scale" />`,
    },
  ],

  props: [
    { name: 'animation', type: "'bounce' | 'pulse' | 'scale' | 'wave'", default: "'bounce'", description: 'Animation style for the dots.' },
    { name: 'bubble', type: 'boolean', default: 'false', description: 'Wraps dots inside a chat-bubble-shaped container.' },
    { name: 'align', type: "'incoming' | 'outgoing'", default: "'incoming'", description: 'Alignment direction (only relevant in bubble mode).' },
    { name: 'avatar', type: 'React.ReactNode', description: 'Avatar element beside the bubble (bubble mode only).' },
    { name: 'sender', type: 'string', description: 'Sender name above the bubble (bubble mode only).' },
    { name: 'color', type: 'string', description: 'Override color for the dots.' },
    { name: 'dotSize', type: 'number', default: '8', description: 'Dot diameter in pixels.' },
  ],
};
