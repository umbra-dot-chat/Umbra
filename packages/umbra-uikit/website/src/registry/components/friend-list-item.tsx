import React from 'react';
import { FriendListItem, Avatar, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const MessageIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const MoreIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={12} cy={12} r={1} />
    <circle cx={19} cy={12} r={1} />
    <circle cx={5} cy={12} r={1} />
  </svg>
);

export const friendListItemEntry: ComponentEntry = {
  slug: 'friend-list-item',
  name: 'FriendListItem',
  category: 'components',
  subcategory: 'Social',
  description:
    'A list item displaying a friend\'s avatar, name, username, online status, and trailing action buttons for quick interactions like messaging or removal.',
  variantCount: 3,
  keywords: ['friend', 'list', 'item', 'avatar', 'status', 'online', 'social', 'contact'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <FriendListItem
        name="Alice Johnson"
        username="@alice"
        status="online"
        avatar={<Avatar name="Alice Johnson" size="md" />}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 400 }}>
          <FriendListItem
            name="Alice Johnson"
            username="@alice"
            avatar={<Avatar name="Alice Johnson" size="md" />}
            status="online"
            statusText="Playing Valorant"
          />
          <FriendListItem
            name="Bob Smith"
            username="@bobsmith"
            avatar={<Avatar name="Bob Smith" size="md" />}
            status="idle"
            statusText="Away"
          />
          <FriendListItem
            name="Carol Davis"
            username="@carol"
            avatar={<Avatar name="Carol Davis" size="md" />}
            status="dnd"
            statusText="Do not disturb"
          />
          <FriendListItem
            name="Dave Wilson"
            username="@dave"
            avatar={<Avatar name="Dave Wilson" size="md" />}
            status="offline"
            mutualFriends={3}
          />
        </VStack>
      ),
      code: `import { FriendListItem, Avatar } from '@wisp-ui/react';

<FriendListItem
  name="Alice Johnson"
  username="@alice"
  avatar={<Avatar name="Alice Johnson" size="md" />}
  status="online"
  statusText="Playing Valorant"
/>
<FriendListItem
  name="Bob Smith"
  username="@bobsmith"
  avatar={<Avatar name="Bob Smith" size="md" />}
  status="idle"
  statusText="Away"
/>`,
    },
    {
      title: 'With Actions',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 400 }}>
          <FriendListItem
            name="Alice Johnson"
            username="@alice"
            avatar={<Avatar name="Alice Johnson" size="md" />}
            status="online"
            actions={[
              { id: 'message', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
              { id: 'more', label: 'More', icon: <MoreIcon />, onPress: () => {} },
            ]}
          />
          <FriendListItem
            name="Bob Smith"
            username="@bobsmith"
            avatar={<Avatar name="Bob Smith" size="md" />}
            status="idle"
            actions={[
              { id: 'message', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
              { id: 'more', label: 'More', icon: <MoreIcon />, onPress: () => {} },
            ]}
          />
        </VStack>
      ),
      code: `<FriendListItem
  name="Alice Johnson"
  username="@alice"
  avatar={<Avatar name="Alice Johnson" size="md" />}
  status="online"
  actions={[
    { id: 'message', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
    { id: 'more', label: 'More', icon: <MoreIcon />, onPress: () => {} },
  ]}
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 400 }}>
          <FriendListItem skeleton name="" />
          <FriendListItem skeleton name="" />
          <FriendListItem skeleton name="" />
        </VStack>
      ),
      code: `<FriendListItem skeleton name="" />`,
    },
  ],

  props: [
    { name: 'name', type: 'string', required: true, description: "Friend's display name." },
    { name: 'username', type: 'string', description: "Username handle (e.g. '@alice')." },
    { name: 'avatar', type: 'ReactNode', description: 'Avatar element (typically an Avatar component).' },
    { name: 'status', type: "'online' | 'idle' | 'dnd' | 'offline'", default: "'offline'", description: 'Online / presence status.' },
    { name: 'statusText', type: 'string', description: "Custom status text (e.g. 'Playing Valorant')." },
    { name: 'mutualFriends', type: 'number', description: 'Number of mutual friends.' },
    { name: 'actions', type: 'FriendAction[]', description: 'Action buttons rendered at the trailing edge.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether this item is disabled.' },
    { name: 'onClick', type: '(e: React.MouseEvent) => void', description: 'Called when the item is pressed.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
