import React from 'react';
import { MessageGroup, ChatBubble, Avatar, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const messageGroupEntry: ComponentEntry = {
  slug: 'message-group',
  name: 'MessageGroup',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Groups consecutive chat bubbles from the same sender with an avatar and name header. Timestamp and status are rendered once below the entire group.',
  variantCount: 2,
  keywords: ['message', 'group', 'chat', 'conversation', 'thread', 'bubble'],

  cardPreview: (
    <VStack gap="md" style={{ width: '100%', maxWidth: 220, pointerEvents: 'none' }}>
      <MessageGroup align="incoming" sender="Alice" avatar={<Avatar name="Alice" size="xs" />} timestamp="2:30 PM">
        <ChatBubble align="incoming">Hey!</ChatBubble>
        <ChatBubble align="incoming">How are you?</ChatBubble>
      </MessageGroup>
    </VStack>
  ),

  examples: [
    {
      title: 'Conversation',
      render: (
        <VStack gap="lg" style={{ maxWidth: 420 }}>
          <MessageGroup
            align="incoming"
            sender="Alice"
            avatar={<Avatar name="Alice" size="sm" />}
            timestamp="2:30 PM"
          >
            <ChatBubble align="incoming">
              Hey! Are you coming to the meeting?
            </ChatBubble>
            <ChatBubble align="incoming">
              It starts in 10 minutes
            </ChatBubble>
          </MessageGroup>

          <MessageGroup align="outgoing" timestamp="2:31 PM" status="read">
            <ChatBubble align="outgoing" variant="accent">
              Yeah, on my way!
            </ChatBubble>
            <ChatBubble align="outgoing" variant="accent">
              Save me a seat 🙏
            </ChatBubble>
          </MessageGroup>

          <MessageGroup
            align="incoming"
            sender="Alice"
            avatar={<Avatar name="Alice" size="sm" />}
            timestamp="2:32 PM"
          >
            <ChatBubble align="incoming">
              Will do! 👍
            </ChatBubble>
          </MessageGroup>
        </VStack>
      ),
      code: `import { MessageGroup, ChatBubble, Avatar } from '@wisp-ui/react';

<MessageGroup
  align="incoming"
  sender="Alice"
  avatar={<Avatar name="Alice" size="sm" />}
  timestamp="2:30 PM"
>
  <ChatBubble align="incoming">
    Hey! Are you coming to the meeting?
  </ChatBubble>
  <ChatBubble align="incoming">
    It starts in 10 minutes
  </ChatBubble>
</MessageGroup>

<MessageGroup align="outgoing" timestamp="2:31 PM" status="read">
  <ChatBubble align="outgoing" variant="accent">
    Yeah, on my way!
  </ChatBubble>
</MessageGroup>`,
      rnCode: `import { MessageGroup, ChatBubble, Avatar } from '@wisp-ui/react-native';

<MessageGroup
  align="incoming"
  sender="Alice"
  avatar={<Avatar name="Alice" size="sm" />}
  timestamp="2:30 PM"
>
  <ChatBubble align="incoming">
    Hey! Are you coming to the meeting?
  </ChatBubble>
  <ChatBubble align="incoming">
    It starts in 10 minutes
  </ChatBubble>
</MessageGroup>

<MessageGroup align="outgoing" timestamp="2:31 PM" status="read">
  <ChatBubble align="outgoing" variant="accent">
    Yeah, on my way!
  </ChatBubble>
</MessageGroup>`,
    },
    {
      title: 'Outgoing (no avatar)',
      render: (
        <VStack gap="sm" style={{ maxWidth: 420 }}>
          <MessageGroup align="outgoing" timestamp="2:31 PM" status="sent">
            <ChatBubble align="outgoing" variant="accent">
              Just pushed the latest changes
            </ChatBubble>
            <ChatBubble align="outgoing" variant="accent">
              Can you review the PR?
            </ChatBubble>
            <ChatBubble align="outgoing" variant="accent">
              Link: github.com/wisp/pull/42
            </ChatBubble>
          </MessageGroup>
        </VStack>
      ),
      code: `<MessageGroup align="outgoing" timestamp="2:31 PM" status="sent">
  <ChatBubble align="outgoing" variant="accent">
    Just pushed the latest changes
  </ChatBubble>
  <ChatBubble align="outgoing" variant="accent">
    Can you review the PR?
  </ChatBubble>
  <ChatBubble align="outgoing" variant="accent">
    Link: github.com/wisp/pull/42
  </ChatBubble>
</MessageGroup>`,
      rnCode: `import { MessageGroup, ChatBubble } from '@wisp-ui/react-native';

<MessageGroup align="outgoing" timestamp="2:31 PM" status="sent">
  <ChatBubble align="outgoing" variant="accent">
    Just pushed the latest changes
  </ChatBubble>
  <ChatBubble align="outgoing" variant="accent">
    Can you review the PR?
  </ChatBubble>
  <ChatBubble align="outgoing" variant="accent">
    Link: github.com/wisp/pull/42
  </ChatBubble>
</MessageGroup>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'ChatBubble elements to stack in the group.' },
    { name: 'align', type: "'incoming' | 'outgoing'", default: "'incoming'", description: 'Alignment direction of the group.' },
    { name: 'sender', type: 'string', description: 'Sender display name shown above the first bubble.' },
    { name: 'avatar', type: 'React.ReactNode', description: 'Avatar element rendered beside the sender name.' },
    { name: 'timestamp', type: 'string', description: 'Timestamp text displayed below the entire group.' },
    { name: 'status', type: "'sent' | 'delivered' | 'read'", description: 'Delivery status indicator shown in the group footer.' },
  ],
};
