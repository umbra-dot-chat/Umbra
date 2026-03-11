import React from 'react';
import { NotificationGroup, NotificationItem, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const notificationGroupEntry: ComponentEntry = {
  slug: 'notification-group',
  name: 'NotificationGroup',
  category: 'components',
  subcategory: 'Notifications',
  description:
    'Date-grouped section header for notifications with label, count badge, and separator line.',
  keywords: ['notification', 'group', 'section', 'header', 'date', 'today', 'yesterday'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 240, pointerEvents: 'none' }}>
      <NotificationGroup label="Today" count={3}>
        <NotificationItem
          id="p1"
          type="friend_request_received"
          title="Friend Request"
          description="Alice wants to connect"
          timestamp="2m"
          read={false}
          avatarFallback="A"
        />
      </NotificationGroup>
    </div>
  ),

  examples: [
    {
      title: 'Date Groups',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 420 }}>
          <NotificationGroup label="Today" count={2}>
            <NotificationItem
              id="g1"
              type="friend_request_received"
              title="Friend Request"
              description="Alice sent you a friend request"
              timestamp="2 min ago"
              read={false}
              avatarFallback="AL"
            />
            <NotificationItem
              id="g2"
              type="call_missed"
              title="Missed Call"
              description="Bob tried to call you"
              timestamp="45 min ago"
              read={false}
              avatarFallback="BS"
            />
          </NotificationGroup>

          <NotificationGroup label="Yesterday" count={1}>
            <NotificationItem
              id="g3"
              type="system"
              title="System Update"
              description="Version 2.1 is now available"
              timestamp="Yesterday"
              read={true}
              avatarFallback="S"
            />
          </NotificationGroup>

          <NotificationGroup label="This Week" count={1}>
            <NotificationItem
              id="g4"
              type="friend_request_accepted"
              title="Request Accepted"
              description="Carol accepted your friend request"
              timestamp="3 days ago"
              read={true}
              avatarFallback="CW"
            />
          </NotificationGroup>
        </VStack>
      ),
      code: `import { NotificationGroup, NotificationItem } from '@wisp-ui/react';

<NotificationGroup label="Today" count={2}>
  <NotificationItem
    id="1"
    type="friend_request_received"
    title="Friend Request"
    description="Alice sent you a friend request"
    timestamp="2 min ago"
    read={false}
    avatarFallback="AL"
  />
  <NotificationItem
    id="2"
    type="call_missed"
    title="Missed Call"
    description="Bob tried to call you"
    timestamp="45 min ago"
    read={false}
    avatarFallback="BS"
  />
</NotificationGroup>`,
      rnCode: `import { NotificationGroup, NotificationItem } from '@wisp-ui/react-native';

<NotificationGroup label="Today" count={2}>
  <NotificationItem
    id="1"
    type="friend_request_received"
    title="Friend Request"
    description="Alice sent you a friend request"
    timestamp="2 min ago"
    read={false}
    avatarFallback="AL"
  />
</NotificationGroup>`,
    },
    {
      title: 'Without Count',
      render: (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <NotificationGroup label="Older">
            <NotificationItem
              id="nc1"
              type="community_invite"
              title="Community Invite"
              description="You were invited to join Umbra HQ"
              timestamp="2 weeks ago"
              read={true}
              avatarFallback="U"
            />
          </NotificationGroup>
        </div>
      ),
      code: `<NotificationGroup label="Older">
  <NotificationItem ... />
</NotificationGroup>`,
    },
  ],

  props: [
    { name: 'label', type: 'string', required: true, description: 'Group header text (e.g. "Today", "Yesterday").' },
    { name: 'count', type: 'number', description: 'Optional count badge next to the label.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'NotificationItem children.' },
  ],
};
