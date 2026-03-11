import React from 'react';
import { ChatBubble, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const chatBubbleEntry: ComponentEntry = {
  slug: 'chat-bubble',
  name: 'ChatBubble',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'A styled message bubble with one sharp corner indicating direction — iMessage / WhatsApp style. Supports timestamps, delivery status, emoji reactions, replies, forwarding, editing, media, and message highlighting.',
  variantCount: 2,
  keywords: ['chat', 'bubble', 'message', 'conversation', 'im', 'messaging', 'text', 'reply', 'forward', 'edit'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 220, pointerEvents: 'none' }}>
      <div style={{ alignSelf: 'flex-start' }}>
        <ChatBubble align="incoming">Hey there!</ChatBubble>
      </div>
      <div style={{ alignSelf: 'flex-end' }}>
        <ChatBubble align="outgoing" variant="accent">
          Hi! 👋
        </ChatBubble>
      </div>
    </VStack>
  ),

  examples: [
    {
      title: 'Incoming & Outgoing',
      render: (
        <VStack gap="sm" style={{ maxWidth: 400 }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble align="incoming" timestamp="2:30 PM">
              Hey! How are you?
            </ChatBubble>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <ChatBubble align="outgoing" variant="accent" timestamp="2:31 PM" status="read">
              Doing great, thanks! 🎉
            </ChatBubble>
          </div>
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble align="incoming" timestamp="2:32 PM">
              Want to grab lunch?
            </ChatBubble>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <ChatBubble align="outgoing" variant="accent" timestamp="2:32 PM" status="delivered">
              Sure, sounds good!
            </ChatBubble>
          </div>
        </VStack>
      ),
      code: `import { ChatBubble } from '@wisp-ui/react';

<ChatBubble align="incoming" timestamp="2:30 PM">
  Hey! How are you?
</ChatBubble>

<ChatBubble align="outgoing" variant="accent" timestamp="2:31 PM" status="read">
  Doing great, thanks! 🎉
</ChatBubble>`,
      rnCode: `import { ChatBubble } from '@wisp-ui/react-native';

<ChatBubble align="incoming" timestamp="2:30 PM">
  Hey! How are you?
</ChatBubble>

<ChatBubble align="outgoing" variant="accent" timestamp="2:31 PM" status="read">
  Doing great, thanks! 🎉
</ChatBubble>`,
    },
    {
      title: 'Variants',
      render: (
        <VStack gap="sm" style={{ maxWidth: 400 }}>
          <HStack gap="sm" align="start">
            <Text size="xs" color="tertiary" style={{ width: 60, paddingTop: 8 }}>default</Text>
            <VStack gap="xs">
              <ChatBubble align="incoming">Incoming default</ChatBubble>
              <ChatBubble align="outgoing">Outgoing default</ChatBubble>
            </VStack>
          </HStack>
          <HStack gap="sm" align="start">
            <Text size="xs" color="tertiary" style={{ width: 60, paddingTop: 8 }}>accent</Text>
            <VStack gap="xs">
              <ChatBubble align="incoming" variant="accent">Incoming accent</ChatBubble>
              <ChatBubble align="outgoing" variant="accent">Outgoing accent</ChatBubble>
            </VStack>
          </HStack>
        </VStack>
      ),
      code: `<ChatBubble align="incoming">Incoming default</ChatBubble>
<ChatBubble align="outgoing">Outgoing default</ChatBubble>
<ChatBubble align="outgoing" variant="accent">Outgoing accent</ChatBubble>`,
      rnCode: `import { ChatBubble } from '@wisp-ui/react-native';

<ChatBubble align="incoming">Incoming default</ChatBubble>
<ChatBubble align="outgoing">Outgoing default</ChatBubble>
<ChatBubble align="outgoing" variant="accent">Outgoing accent</ChatBubble>`,
    },
    {
      title: 'With Reactions',
      render: (
        <VStack gap="sm" style={{ maxWidth: 400 }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble
              align="incoming"
              timestamp="2:30 PM"
              reactions={[
                { emoji: '👍', count: 3, reacted: true },
                { emoji: '❤️', count: 1 },
                { emoji: '😂', count: 2 },
              ]}
            >
              This is hilarious! Check out this meme 😂
            </ChatBubble>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <ChatBubble
              align="outgoing"
              variant="accent"
              timestamp="2:31 PM"
              status="read"
              reactions={[
                { emoji: '🔥', count: 1 },
              ]}
            >
              LOL 😂
            </ChatBubble>
          </div>
        </VStack>
      ),
      code: `<ChatBubble
  align="incoming"
  timestamp="2:30 PM"
  reactions={[
    { emoji: '👍', count: 3, reacted: true },
    { emoji: '❤️', count: 1 },
    { emoji: '😂', count: 2 },
  ]}
>
  This is hilarious!
</ChatBubble>`,
      rnCode: `import { ChatBubble } from '@wisp-ui/react-native';

<ChatBubble
  align="incoming"
  timestamp="2:30 PM"
  reactions={[
    { emoji: '👍', count: 3, reacted: true },
    { emoji: '❤️', count: 1 },
    { emoji: '😂', count: 2 },
  ]}
>
  This is hilarious!
</ChatBubble>`,
    },
    {
      title: 'Delivery Status',
      render: (
        <VStack gap="sm" style={{ maxWidth: 400, alignItems: 'flex-end' }}>
          <ChatBubble align="outgoing" variant="accent" timestamp="2:30 PM" status="sent">
            Sent message
          </ChatBubble>
          <ChatBubble align="outgoing" variant="accent" timestamp="2:31 PM" status="delivered">
            Delivered message
          </ChatBubble>
          <ChatBubble align="outgoing" variant="accent" timestamp="2:32 PM" status="read">
            Read message
          </ChatBubble>
        </VStack>
      ),
      code: `<ChatBubble align="outgoing" variant="accent" timestamp="2:30 PM" status="sent">
  Sent message
</ChatBubble>
<ChatBubble align="outgoing" variant="accent" timestamp="2:31 PM" status="delivered">
  Delivered message
</ChatBubble>
<ChatBubble align="outgoing" variant="accent" timestamp="2:32 PM" status="read">
  Read message
</ChatBubble>`,
      rnCode: `import { ChatBubble } from '@wisp-ui/react-native';

<ChatBubble align="outgoing" variant="accent" timestamp="2:30 PM" status="sent">
  Sent message
</ChatBubble>
<ChatBubble align="outgoing" variant="accent" timestamp="2:31 PM" status="delivered">
  Delivered message
</ChatBubble>
<ChatBubble align="outgoing" variant="accent" timestamp="2:32 PM" status="read">
  Read message
</ChatBubble>`,
    },
    {
      title: 'Reply To',
      render: (
        <VStack gap="sm" style={{ maxWidth: 400 }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble
              align="incoming"
              timestamp="2:35 PM"
              replyTo={{ sender: 'Alice', text: 'Want to grab lunch?' }}
            >
              Sure, sounds good! Where do you want to go?
            </ChatBubble>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <ChatBubble
              align="outgoing"
              variant="accent"
              timestamp="2:36 PM"
              status="read"
              replyTo={{ sender: 'Bob', text: 'Sure, sounds good! Where do you want to go?' }}
            >
              How about the new place downtown?
            </ChatBubble>
          </div>
        </VStack>
      ),
      code: `<ChatBubble
  align="incoming"
  timestamp="2:35 PM"
  replyTo={{ sender: 'Alice', text: 'Want to grab lunch?' }}
>
  Sure, sounds good! Where do you want to go?
</ChatBubble>`,
      rnCode: `import { ChatBubble } from '@wisp-ui/react-native';

<ChatBubble
  align="incoming"
  timestamp="2:35 PM"
  replyTo={{ sender: 'Alice', text: 'Want to grab lunch?' }}
>
  Sure, sounds good! Where do you want to go?
</ChatBubble>`,
    },
    {
      title: 'Forwarded & Edited',
      render: (
        <VStack gap="sm" style={{ maxWidth: 400 }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble
              align="incoming"
              timestamp="3:00 PM"
              forwarded={{ from: 'Charlie' }}
            >
              Check out this event happening next weekend!
            </ChatBubble>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <ChatBubble
              align="outgoing"
              variant="accent"
              timestamp="3:02 PM"
              status="read"
              edited
            >
              I updated the meeting time to 3 PM instead
            </ChatBubble>
          </div>
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble
              align="incoming"
              timestamp="3:03 PM"
              forwarded
            >
              Important announcement for everyone
            </ChatBubble>
          </div>
        </VStack>
      ),
      code: `{/* Forwarded from a specific person */}
<ChatBubble
  align="incoming"
  timestamp="3:00 PM"
  forwarded={{ from: 'Charlie' }}
>
  Check out this event happening next weekend!
</ChatBubble>

{/* Edited message */}
<ChatBubble
  align="outgoing"
  variant="accent"
  timestamp="3:02 PM"
  status="read"
  edited
>
  I updated the meeting time to 3 PM instead
</ChatBubble>

{/* Simple forwarded */}
<ChatBubble align="incoming" timestamp="3:03 PM" forwarded>
  Important announcement for everyone
</ChatBubble>`,
      rnCode: `import { ChatBubble } from '@wisp-ui/react-native';

<ChatBubble
  align="incoming"
  timestamp="3:00 PM"
  forwarded={{ from: 'Charlie' }}
>
  Check out this event happening next weekend!
</ChatBubble>

<ChatBubble
  align="outgoing"
  variant="accent"
  timestamp="3:02 PM"
  status="read"
  edited
>
  I updated the meeting time to 3 PM instead
</ChatBubble>`,
    },
    {
      title: 'With Media',
      render: (
        <VStack gap="sm" style={{ maxWidth: 400 }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <ChatBubble
              align="incoming"
              timestamp="4:15 PM"
              media={
                <div style={{
                  width: 200,
                  height: 120,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #667 0%, #999 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12,
                }}>
                  Image placeholder
                </div>
              }
            >
              Look at this view!
            </ChatBubble>
          </div>
        </VStack>
      ),
      code: `<ChatBubble
  align="incoming"
  timestamp="4:15 PM"
  media={<img src="..." alt="Photo" style={{ borderRadius: 8, maxWidth: 200 }} />}
>
  Look at this view!
</ChatBubble>`,
      rnCode: `import { ChatBubble } from '@wisp-ui/react-native';
import { Image } from 'react-native';

<ChatBubble
  align="incoming"
  timestamp="4:15 PM"
  media={<Image source={{ uri: '...' }} style={{ width: 200, height: 120, borderRadius: 8 }} />}
>
  Look at this view!
</ChatBubble>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Message content.' },
    { name: 'align', type: "'incoming' | 'outgoing'", default: "'incoming'", description: 'Direction of the message. Controls corner radius and alignment.' },
    { name: 'variant', type: "'default' | 'accent'", default: "'default'", description: 'Visual color variant.' },
    { name: 'timestamp', type: 'string', description: 'Timestamp text displayed below the bubble. Suppressed when inside a MessageGroup.' },
    { name: 'status', type: "'sent' | 'delivered' | 'read'", description: 'Delivery status indicator (typically for outgoing).' },
    { name: 'reactions', type: 'ChatBubbleReaction[]', description: 'Array of emoji reactions displayed below the bubble.' },
    { name: 'onReactionClick', type: '(emoji: string) => void', description: 'Callback when a reaction chip is clicked.' },
    { name: 'replyTo', type: 'ChatBubbleReplyTo', description: 'Quoted reply metadata. Shows a preview strip above the message content with sender name and text.' },
    { name: 'forwarded', type: "boolean | { from: string }", description: 'Marks the message as forwarded. Shows a "Forwarded" or "Forwarded from X" label.' },
    { name: 'edited', type: 'boolean', default: 'false', description: 'Appends "(edited)" to the timestamp in the footer.' },
    { name: 'highlighted', type: 'boolean', default: 'false', description: 'Applies a brief highlight animation, used when jumping to a message.' },
    { name: 'media', type: 'React.ReactNode', description: 'Slot for media content (images, video, files) rendered above the text content.' },
    { name: 'senderColor', type: 'string', description: 'Custom color for sender name in reply previews (for group chat color coding).' },
  ],
};
