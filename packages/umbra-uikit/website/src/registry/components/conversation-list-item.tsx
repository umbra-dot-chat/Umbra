import React from 'react';
import { ConversationListItem, Avatar, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const conversationListItemEntry: ComponentEntry = {
  slug: 'conversation-list-item',
  name: 'ConversationListItem',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Rich list item for messaging app conversation sidebars with avatar, name, last message preview, timestamp, unread badge, online dot, and pinned/muted indicators.',
  variantCount: 1,
  keywords: ['conversation', 'list', 'chat', 'sidebar', 'message', 'unread', 'online', 'pinned', 'muted'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <ConversationListItem
        name="Alice"
        lastMessage="Hey, want to grab lunch?"
        timestamp="2m"
        unreadCount={3}
        online
        avatar={<Avatar name="Alice" size="md" />}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 360 }}>
          <ConversationListItem
            name="Alice Johnson"
            avatar={<Avatar name="Alice Johnson" size="md" />}
            lastMessage="Hey, want to grab lunch today?"
            timestamp="2m ago"
            unreadCount={3}
            online
          />
          <ConversationListItem
            name="Bob Smith"
            avatar={<Avatar name="Bob Smith" size="md" />}
            lastMessage="I'll send the report later"
            timestamp="1h ago"
          />
          <ConversationListItem
            name="Team Chat"
            avatar={<Avatar name="Team Chat" size="md" />}
            lastMessage="Meeting at 3 PM"
            timestamp="Yesterday"
            pinned
          />
        </VStack>
      ),
      code: `import { ConversationListItem, Avatar } from '@wisp-ui/react';

<ConversationListItem
  name="Alice Johnson"
  avatar={<Avatar name="Alice Johnson" size="md" />}
  lastMessage="Hey, want to grab lunch today?"
  timestamp="2m ago"
  unreadCount={3}
  online
/>`,
    },
    {
      title: 'Active State',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 360 }}>
          <ConversationListItem
            name="Alice Johnson"
            avatar={<Avatar name="Alice Johnson" size="md" />}
            lastMessage="Hey, want to grab lunch today?"
            timestamp="2m ago"
            online
          />
          <ConversationListItem
            name="Bob Smith"
            avatar={<Avatar name="Bob Smith" size="md" />}
            lastMessage="I'll send the report later"
            timestamp="1h ago"
            active
          />
          <ConversationListItem
            name="Carol Davis"
            avatar={<Avatar name="Carol Davis" size="md" />}
            lastMessage="Sounds good!"
            timestamp="3h ago"
          />
        </VStack>
      ),
      code: `<ConversationListItem
  name="Bob Smith"
  avatar={<Avatar name="Bob Smith" size="md" />}
  lastMessage="I'll send the report later"
  timestamp="1h ago"
  active
/>`,
    },
    {
      title: 'With Indicators',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 360 }}>
          <ConversationListItem
            name="Pinned Chat"
            avatar={<Avatar name="Pinned Chat" size="md" />}
            lastMessage="Don't forget the meeting tomorrow"
            timestamp="5m ago"
            pinned
            unreadCount={1}
          />
          <ConversationListItem
            name="Muted Group"
            avatar={<Avatar name="Muted Group" size="md" />}
            lastMessage="Someone sent a photo"
            timestamp="1h ago"
            muted
            unreadCount={42}
          />
          <ConversationListItem
            name="Pinned & Muted"
            avatar={<Avatar name="Pinned & Muted" size="md" />}
            lastMessage="Old conversation"
            timestamp="2d ago"
            pinned
            muted
          />
        </VStack>
      ),
      code: `<ConversationListItem
  name="Pinned Chat"
  pinned
  unreadCount={1}
/>
<ConversationListItem
  name="Muted Group"
  muted
  unreadCount={42}
/>`,
    },
    {
      title: 'Disabled',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 360 }}>
          <ConversationListItem
            name="Archived Chat"
            avatar={<Avatar name="Archived Chat" size="md" />}
            lastMessage="This conversation is archived"
            timestamp="1w ago"
            disabled
          />
        </VStack>
      ),
      code: `<ConversationListItem
  name="Archived Chat"
  disabled
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 360 }}>
          <ConversationListItem skeleton name="" />
          <ConversationListItem skeleton name="" />
          <ConversationListItem skeleton name="" />
        </VStack>
      ),
      code: `<ConversationListItem skeleton name="" />`,
    },
  ],

  props: [
    { name: 'name', type: 'string', description: 'Display name of the conversation.' },
    { name: 'avatar', type: 'React.ReactNode', description: 'Avatar element (typically an Avatar component).' },
    { name: 'lastMessage', type: 'string', description: 'Last message preview text (truncated to one line).' },
    { name: 'timestamp', type: 'string', description: 'Timestamp string (e.g. "2m ago", "Yesterday").' },
    { name: 'unreadCount', type: 'number', default: '0', description: 'Number of unread messages. Shows a badge when > 0.' },
    { name: 'online', type: 'boolean', default: 'false', description: 'Whether the user is currently online (shows a green dot).' },
    { name: 'pinned', type: 'boolean', default: 'false', description: 'Whether this conversation is pinned.' },
    { name: 'muted', type: 'boolean', default: 'false', description: 'Whether this conversation is muted.' },
    { name: 'active', type: 'boolean', default: 'false', description: 'Whether this item is currently selected / active.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the item is disabled.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
