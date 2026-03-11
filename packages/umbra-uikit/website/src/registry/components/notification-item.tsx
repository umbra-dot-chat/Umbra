import React, { useState } from 'react';
import { NotificationItem, VStack, HStack, Text } from '@wisp-ui/react';
import { Bell, UserPlus, Phone } from 'lucide-react';
import type { ComponentEntry } from '../types';

function InteractiveDemo() {
  const [read, setRead] = useState(false);
  return (
    <VStack gap="md" style={{ width: '100%', maxWidth: 420 }}>
      <NotificationItem
        id="demo-1"
        type="friend_request_received"
        title="Friend Request"
        description="Alice sent you a friend request"
        timestamp="2m ago"
        read={read}
        avatarFallback="A"
        onPress={() => setRead(true)}
        onDismiss={() => {}}
        actions={[
          { label: 'Accept', variant: 'primary', onPress: () => setRead(true) },
          { label: 'Decline', variant: 'secondary', onPress: () => setRead(true) },
        ]}
      />
      <Text size="xs" color="muted">Click the notification to mark as read</Text>
    </VStack>
  );
}

export const notificationItemEntry: ComponentEntry = {
  slug: 'notification-item',
  name: 'NotificationItem',
  category: 'components',
  subcategory: 'Notifications',
  description:
    'Individual notification row with avatar/icon, read/unread state, action buttons, and dismiss control.',
  variantCount: 9,
  keywords: ['notification', 'alert', 'item', 'unread', 'badge', 'friend request', 'call'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 260, pointerEvents: 'none' }}>
      <VStack gap="xs">
        <NotificationItem
          id="preview-1"
          type="friend_request_received"
          title="Friend Request"
          description="Alice wants to connect"
          timestamp="2m"
          read={false}
          avatarFallback="A"
        />
        <NotificationItem
          id="preview-2"
          type="call_missed"
          title="Missed Call"
          description="Bob tried calling you"
          timestamp="1h"
          read={true}
          avatarFallback="B"
        />
      </VStack>
    </div>
  ),

  examples: [
    {
      title: 'Unread States',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 420 }}>
          <NotificationItem
            id="ex-1"
            type="friend_request_received"
            title="Friend Request"
            description="Alice sent you a friend request"
            timestamp="2 min ago"
            read={false}
            avatarFallback="AL"
          />
          <NotificationItem
            id="ex-2"
            type="call_missed"
            title="Missed Call"
            description="Bob tried to call you"
            timestamp="1 hour ago"
            read={false}
            avatarFallback="BS"
          />
          <NotificationItem
            id="ex-3"
            type="system"
            title="System Update"
            description="Version 2.1 is now available"
            timestamp="3 hours ago"
            read={true}
            icon={Bell as any}
          />
        </VStack>
      ),
      code: `import { NotificationItem } from '@wisp-ui/react';

<NotificationItem
  id="1"
  type="friend_request_received"
  title="Friend Request"
  description="Alice sent you a friend request"
  timestamp="2 min ago"
  read={false}
  avatarFallback="AL"
/>`,
      rnCode: `import { NotificationItem } from '@wisp-ui/react-native';

<NotificationItem
  id="1"
  type="friend_request_received"
  title="Friend Request"
  description="Alice sent you a friend request"
  timestamp="2 min ago"
  read={false}
  avatarFallback="AL"
/>`,
    },
    {
      title: 'With Action Buttons',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 420 }}>
          <NotificationItem
            id="ex-act-1"
            type="friend_request_received"
            title="Friend Request"
            description="Carol wants to be your friend"
            timestamp="Just now"
            read={false}
            avatarFallback="CW"
            actions={[
              { label: 'Accept', variant: 'primary', onPress: () => {} },
              { label: 'Decline', variant: 'secondary', onPress: () => {} },
            ]}
          />
          <NotificationItem
            id="ex-act-2"
            type="community_invite"
            title="Community Invite"
            description="You've been invited to Umbra HQ"
            timestamp="5 min ago"
            read={false}
            avatarFallback="U"
            actions={[
              { label: 'Join', variant: 'primary', onPress: () => {} },
              { label: 'Ignore', variant: 'secondary', onPress: () => {} },
            ]}
          />
        </VStack>
      ),
      code: `<NotificationItem
  id="1"
  type="friend_request_received"
  title="Friend Request"
  description="Carol wants to be your friend"
  timestamp="Just now"
  read={false}
  avatarFallback="CW"
  actions={[
    { label: 'Accept', variant: 'primary', onPress: handleAccept },
    { label: 'Decline', variant: 'secondary', onPress: handleDecline },
  ]}
/>`,
    },
    {
      title: 'Interactive Demo',
      render: <InteractiveDemo />,
      code: `const [read, setRead] = useState(false);

<NotificationItem
  id="demo"
  type="friend_request_received"
  title="Friend Request"
  description="Alice sent you a friend request"
  timestamp="2m ago"
  read={read}
  onPress={() => setRead(true)}
  onDismiss={() => removeNotification()}
/>`,
    },
    {
      title: 'All Types',
      render: (
        <VStack gap="xs" style={{ width: '100%', maxWidth: 420 }}>
          {([
            { type: 'friend_request_received', title: 'Friend Request', desc: 'New friend request' },
            { type: 'friend_request_accepted', title: 'Request Accepted', desc: 'You are now friends' },
            { type: 'friend_request_rejected', title: 'Request Declined', desc: 'Your request was declined' },
            { type: 'call_missed', title: 'Missed Call', desc: 'You missed a voice call' },
            { type: 'call_completed', title: 'Call Ended', desc: 'Voice call - 5 min' },
            { type: 'group_invite', title: 'Group Invite', desc: 'Invited to a new group' },
            { type: 'community_invite', title: 'Community Invite', desc: 'Join Umbra HQ' },
            { type: 'mention', title: 'Mention', desc: 'You were mentioned in #general' },
            { type: 'system', title: 'System', desc: 'App update available' },
          ] as const).map((n) => (
            <NotificationItem
              key={n.type}
              id={n.type}
              type={n.type}
              title={n.title}
              description={n.desc}
              timestamp="now"
              read={false}
              avatarFallback={n.title.charAt(0)}
            />
          ))}
        </VStack>
      ),
      code: `// All 9 notification types:
// friend_request_received, friend_request_accepted, friend_request_rejected,
// call_missed, call_completed, group_invite, community_invite,
// mention, system`,
    },
  ],

  props: [
    { name: 'id', type: 'string', required: true, description: 'Unique notification identifier.' },
    { name: 'type', type: 'NotificationType', required: true, description: 'Notification category — determines accent color.' },
    { name: 'title', type: 'string', required: true, description: 'Primary text.' },
    { name: 'description', type: 'string', description: 'Secondary descriptive text.' },
    { name: 'timestamp', type: 'string', required: true, description: 'Formatted time string (e.g. "2m ago").' },
    { name: 'read', type: 'boolean', required: true, description: 'Whether the notification has been read. Controls accent border and background.' },
    { name: 'avatar', type: 'string', description: 'Avatar image URL.' },
    { name: 'avatarFallback', type: 'string', description: 'Initials fallback when no avatar image is set.' },
    { name: 'icon', type: 'React.ComponentType', description: 'Custom icon component rendered in the avatar slot.' },
    { name: 'iconColor', type: 'string', description: 'Override color for the icon.' },
    { name: 'actions', type: 'NotificationAction[]', description: 'Action buttons shown below the description.' },
    { name: 'onPress', type: '() => void', description: 'Called when the notification row is pressed.' },
    { name: 'onDismiss', type: '() => void', description: 'Called when the dismiss × button is pressed.' },
  ],
};
