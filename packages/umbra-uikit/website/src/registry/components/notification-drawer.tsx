import React, { useState } from 'react';
import { NotificationDrawer, NotificationGroup, NotificationItem, VStack, Text, Icon } from '@wisp-ui/react';
import { Bell } from 'lucide-react';
import type { ComponentEntry } from '../types';
import type { NotificationCategory } from '@wisp-ui/react';

function InteractiveDrawer() {
  const [category, setCategory] = useState<NotificationCategory>('all');
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'system' as const, title: 'System Update', desc: 'Version 2.1 is now available', ts: '2 hours ago', read: true, group: 'Today' },
    { id: '2', type: 'friend_request_accepted' as const, title: 'Request Accepted', desc: 'Carol accepted your request', ts: 'Yesterday', read: true, group: 'Yesterday' },
    { id: '3', type: 'system' as const, title: 'Maintenance Complete', desc: 'All systems operational', ts: '3 days ago', read: true, group: 'This Week' },
  ]);

  const typeToCategory: Record<string, NotificationCategory> = {
    friend_request_accepted: 'social',
    system: 'system',
  };

  const filtered = category === 'all'
    ? notifications
    : notifications.filter((n) => typeToCategory[n.type] === category);

  const groups: Record<string, typeof notifications> = {};
  for (const n of filtered) {
    if (!groups[n.group]) groups[n.group] = [];
    groups[n.group].push(n);
  }

  const unreadCounts = {
    all: notifications.filter((n) => !n.read).length,
    social: notifications.filter((n) => !n.read && typeToCategory[n.type] === 'social').length,
    calls: notifications.filter((n) => !n.read && typeToCategory[n.type] === 'calls').length,
    mentions: notifications.filter((n) => !n.read && typeToCategory[n.type] === 'mentions').length,
    system: notifications.filter((n) => !n.read && typeToCategory[n.type] === 'system').length,
  };

  return (
    <div style={{ width: '100%', maxWidth: 380, height: 520, border: '1px solid var(--border-subtle, #333)', borderRadius: 12, overflow: 'hidden' }}>
      <NotificationDrawer
        open
        onClose={() => {}}
        category={category}
        onCategoryChange={setCategory}
        unreadCounts={unreadCounts}
        onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
      >
        {Object.entries(groups).map(([label, items]) => (
          <NotificationGroup key={label} label={label} count={items.length}>
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                type={n.type}
                title={n.title}
                description={n.desc}
                timestamp={n.ts}
                read={n.read}
                avatarFallback={n.title.charAt(0)}
                onPress={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                onDismiss={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
              />
            ))}
          </NotificationGroup>
        ))}
      </NotificationDrawer>
    </div>
  );
}

export const notificationDrawerEntry: ComponentEntry = {
  slug: 'notification-drawer',
  name: 'NotificationDrawer',
  category: 'components',
  subcategory: 'Notifications',
  description:
    'Full notification panel with header, category tabs, mark-all-read, and scrollable content area.',
  variantCount: 5,
  keywords: ['notification', 'drawer', 'panel', 'sidebar', 'inbox', 'bell', 'unread'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 240, height: 140, overflow: 'hidden', pointerEvents: 'none', borderRadius: 8 }}>
      <NotificationDrawer
        open
        onClose={() => {}}
        category="all"
        onCategoryChange={() => {}}
        unreadCounts={{ all: 0, social: 0, calls: 0, mentions: 0, system: 0 }}
      >
        <NotificationItem
          id="cp1"
          type="system"
          title="System Update"
          timestamp="2h"
          read={true}
          avatarFallback="S"
        />
      </NotificationDrawer>
    </div>
  ),

  examples: [
    {
      title: 'Interactive Drawer',
      render: <InteractiveDrawer />,
      code: `import { NotificationDrawer, NotificationGroup, NotificationItem } from '@wisp-ui/react';

const [category, setCategory] = useState<NotificationCategory>('all');

<NotificationDrawer
  open={isOpen}
  onClose={handleClose}
  category={category}
  onCategoryChange={setCategory}
  unreadCounts={{ all: 1, social: 0, calls: 0, mentions: 0, system: 1 }}
  onMarkAllRead={handleMarkAllRead}
>
  <NotificationGroup label="Today" count={1}>
    <NotificationItem
      id="1"
      type="system"
      title="System Update"
      description="Version 2.1 is now available"
      timestamp="2 hours ago"
      read={false}
      avatarFallback="S"
      onPress={() => markRead("1")}
      onDismiss={() => dismiss("1")}
    />
  </NotificationGroup>
</NotificationDrawer>`,
      rnCode: `import { NotificationDrawer, NotificationGroup, NotificationItem } from '@wisp-ui/react-native';

// Same API — NotificationDrawer renders content only.
// Wrap in Animated.View (desktop) or Sheet (mobile) for positioning.
<Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
  <NotificationDrawer
    open={isOpen}
    onClose={handleClose}
    category={category}
    onCategoryChange={setCategory}
    unreadCounts={unreadCounts}
    onMarkAllRead={handleMarkAllRead}
  >
    {/* NotificationGroups + NotificationItems */}
  </NotificationDrawer>
</Animated.View>`,
    },
    {
      title: 'Empty State',
      render: (
        <div style={{ width: '100%', maxWidth: 380, height: 300, border: '1px solid var(--border-subtle, #333)', borderRadius: 12, overflow: 'hidden' }}>
          <NotificationDrawer
            open
            onClose={() => {}}
            category="all"
            onCategoryChange={() => {}}
            emptyState={
              <VStack gap="sm" style={{ alignItems: 'center' }}>
                <Icon icon={Bell} size="lg" color="muted" />
                <Text size="sm" color="muted">You're all caught up!</Text>
              </VStack>
            }
          />
        </div>
      ),
      code: `import { Bell } from 'lucide-react';

<NotificationDrawer
  open
  onClose={handleClose}
  category="all"
  onCategoryChange={setCategory}
  emptyState={
    <VStack gap="sm" style={{ alignItems: 'center' }}>
      <Icon icon={Bell} size="lg" color="muted" />
      <Text size="sm" color="muted">You're all caught up!</Text>
    </VStack>
  }
/>`,
    },
  ],

  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Whether the drawer content is visible.' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close handler.' },
    { name: 'category', type: 'NotificationCategory', required: true, description: 'Active filter tab: "all" | "social" | "calls" | "mentions" | "system".' },
    { name: 'onCategoryChange', type: '(cat: NotificationCategory) => void', required: true, description: 'Called when a category tab is pressed.' },
    { name: 'unreadCounts', type: 'Partial<Record<NotificationCategory, number>>', description: 'Unread counts per category for tab badges.' },
    { name: 'onMarkAllRead', type: '() => void', description: 'Mark all notifications as read.' },
    { name: 'onClearAll', type: '() => void', description: 'Clear all notifications.' },
    { name: 'children', type: 'React.ReactNode', description: 'Notification content (NotificationGroups + NotificationItems).' },
    { name: 'emptyState', type: 'React.ReactNode', description: 'Content shown when there are no children.' },
  ],
};
