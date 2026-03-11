import React from 'react';
import { UserMiniCard, Avatar, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const MessageIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const UserIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx={12} cy={7} r={4} />
  </svg>
);

export const userMiniCardEntry: ComponentEntry = {
  slug: 'user-mini-card',
  name: 'UserMiniCard',
  category: 'components',
  subcategory: 'Social',
  description:
    'A compact inline card for hovering over a username or mention popover. Shows avatar, name, username, status, and optional quick-action icon buttons. Lighter than the full UserProfileCard.',
  variantCount: 3,
  keywords: ['user', 'mini', 'card', 'hover', 'tooltip', 'popover', 'mention', 'compact', 'social'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <UserMiniCard
        name="Alice Johnson"
        username="@alice"
        status="online"
        avatar={<Avatar name="Alice Johnson" size="md" />}
        style={{ width: 240 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <UserMiniCard
            name="Alice Johnson"
            username="@alice"
            avatar={<Avatar name="Alice Johnson" size="md" />}
            status="online"
            statusText="Available"
            style={{ width: 240 }}
          />
          <UserMiniCard
            name="Bob Smith"
            username="@bobsmith"
            avatar={<Avatar name="Bob Smith" size="md" />}
            status="idle"
            statusText="Away"
            style={{ width: 240 }}
          />
          <UserMiniCard
            name="Carol Davis"
            username="@carol"
            avatar={<Avatar name="Carol Davis" size="md" />}
            status="dnd"
            statusText="In a meeting"
            style={{ width: 240 }}
          />
          <UserMiniCard
            name="Dave Wilson"
            username="@dave"
            avatar={<Avatar name="Dave Wilson" size="md" />}
            status="offline"
            style={{ width: 240 }}
          />
        </div>
      ),
      code: `import { UserMiniCard, Avatar } from '@wisp-ui/react';

<UserMiniCard
  name="Alice Johnson"
  username="@alice"
  avatar={<Avatar name="Alice Johnson" size="md" />}
  status="online"
  statusText="Available"
/>
<UserMiniCard
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
        <VStack gap="md" style={{ width: '100%', maxWidth: 280 }}>
          <UserMiniCard
            name="Alice Johnson"
            username="@alice"
            avatar={<Avatar name="Alice Johnson" size="md" />}
            status="online"
            actions={[
              { id: 'message', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
              { id: 'profile', label: 'View Profile', icon: <UserIcon />, onPress: () => {} },
            ]}
          />
        </VStack>
      ),
      code: `<UserMiniCard
  name="Alice Johnson"
  username="@alice"
  avatar={<Avatar name="Alice Johnson" size="md" />}
  status="online"
  actions={[
    { id: 'message', label: 'Message', icon: <MessageIcon />, onPress: () => {} },
    { id: 'profile', label: 'View Profile', icon: <UserIcon />, onPress: () => {} },
  ]}
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <UserMiniCard skeleton name="" style={{ width: 240 }} />
          <UserMiniCard skeleton name="" style={{ width: 240 }} />
        </div>
      ),
      code: `<UserMiniCard skeleton name="" />`,
    },
  ],

  props: [
    { name: 'name', type: 'string', required: true, description: "User's display name." },
    { name: 'username', type: 'string', description: "Username handle (e.g. '@alice')." },
    { name: 'avatar', type: 'ReactNode', description: 'Avatar element (typically an Avatar component).' },
    { name: 'status', type: "'online' | 'idle' | 'dnd' | 'offline'", default: "'offline'", description: 'Online / presence status.' },
    { name: 'statusText', type: 'string', description: "Custom status text (e.g. 'In a meeting')." },
    { name: 'actions', type: 'UserMiniCardAction[]', description: 'Quick-action icon buttons.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
