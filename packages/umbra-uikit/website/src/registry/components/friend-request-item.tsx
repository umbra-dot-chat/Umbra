import React from 'react';
import { FriendRequestItem, Avatar, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const friendRequestItemEntry: ComponentEntry = {
  slug: 'friend-request-item',
  name: 'FriendRequestItem',
  category: 'components',
  subcategory: 'Social',
  description:
    'A list item for incoming or outgoing friend requests with avatar, name, timestamp, mutual friends count, and contextual action buttons (Accept/Decline or Cancel).',
  variantCount: 3,
  keywords: ['friend', 'request', 'incoming', 'outgoing', 'accept', 'decline', 'cancel', 'social'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <FriendRequestItem
        name="Alice Johnson"
        username="@alice"
        type="incoming"
        timestamp="2 days ago"
        mutualFriends={5}
        avatar={<Avatar name="Alice Johnson" size="md" />}
      />
    </div>
  ),

  examples: [
    {
      title: 'Incoming Requests',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 400 }}>
          <FriendRequestItem
            name="Alice Johnson"
            username="@alice"
            avatar={<Avatar name="Alice Johnson" size="md" />}
            type="incoming"
            timestamp="2 days ago"
            mutualFriends={5}
            onAccept={() => {}}
            onDecline={() => {}}
          />
          <FriendRequestItem
            name="Bob Smith"
            username="@bobsmith"
            avatar={<Avatar name="Bob Smith" size="md" />}
            type="incoming"
            timestamp="1 week ago"
            mutualFriends={2}
            onAccept={() => {}}
            onDecline={() => {}}
          />
          <FriendRequestItem
            name="Carol Davis"
            username="@carol"
            avatar={<Avatar name="Carol Davis" size="md" />}
            type="incoming"
            timestamp="Just now"
            onAccept={() => {}}
            onDecline={() => {}}
          />
        </VStack>
      ),
      code: `import { FriendRequestItem, Avatar } from '@wisp-ui/react';

<FriendRequestItem
  name="Alice Johnson"
  username="@alice"
  avatar={<Avatar name="Alice Johnson" size="md" />}
  type="incoming"
  timestamp="2 days ago"
  mutualFriends={5}
  onAccept={() => {}}
  onDecline={() => {}}
/>`,
    },
    {
      title: 'Outgoing Requests',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 400 }}>
          <FriendRequestItem
            name="Dave Wilson"
            username="@dave"
            avatar={<Avatar name="Dave Wilson" size="md" />}
            type="outgoing"
            timestamp="3 days ago"
            onCancel={() => {}}
          />
          <FriendRequestItem
            name="Eve Martinez"
            username="@evem"
            avatar={<Avatar name="Eve Martinez" size="md" />}
            type="outgoing"
            timestamp="1 hour ago"
            mutualFriends={8}
            onCancel={() => {}}
          />
        </VStack>
      ),
      code: `<FriendRequestItem
  name="Dave Wilson"
  username="@dave"
  avatar={<Avatar name="Dave Wilson" size="md" />}
  type="outgoing"
  timestamp="3 days ago"
  onCancel={() => {}}
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 400 }}>
          <FriendRequestItem skeleton name="" type="incoming" />
          <FriendRequestItem skeleton name="" type="incoming" />
          <FriendRequestItem skeleton name="" type="incoming" />
        </VStack>
      ),
      code: `<FriendRequestItem skeleton name="" type="incoming" />`,
    },
  ],

  props: [
    { name: 'name', type: 'string', required: true, description: "User's display name." },
    { name: 'username', type: 'string', description: "Username handle (e.g. '@alice')." },
    { name: 'avatar', type: 'ReactNode', description: 'Avatar element (typically an Avatar component).' },
    { name: 'type', type: "'incoming' | 'outgoing'", required: true, description: 'Whether this is an incoming or outgoing request.' },
    { name: 'timestamp', type: 'string', description: "When the request was sent (e.g. '2 days ago')." },
    { name: 'mutualFriends', type: 'number', description: 'Number of mutual friends.' },
    { name: 'onAccept', type: '() => void', description: 'Called when the accept button is pressed (incoming only).' },
    { name: 'onDecline', type: '() => void', description: 'Called when the decline button is pressed (incoming only).' },
    { name: 'onCancel', type: '() => void', description: 'Called when the cancel button is pressed (outgoing only).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the item is disabled.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
