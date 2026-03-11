import React, { useState } from 'react';
import { NotificationBell, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function InteractiveBell() {
  const [count, setCount] = useState(0);
  return (
    <VStack gap="md" style={{ alignItems: 'center' }}>
      <NotificationBell
        count={count}
        onPress={() => setCount(0)}
      />
      <HStack gap="sm">
        <button
          onClick={() => setCount((c) => c + 1)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-subtle, #333)',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          + Add
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-subtle, #333)',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Clear
        </button>
      </HStack>
      <Text size="xs" color="muted">
        {count > 0 ? `${count} unread — tap "+" to see shake` : 'Tap "+" to add a notification'}
      </Text>
    </VStack>
  );
}

export const notificationBellEntry: ComponentEntry = {
  slug: 'notification-bell',
  name: 'NotificationBell',
  category: 'components',
  subcategory: 'Notifications',
  description:
    'Bell icon button with unread count badge that shakes subtly when the notification count increases.',
  keywords: ['notification', 'bell', 'badge', 'count', 'unread', 'alert', 'shake'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <HStack gap="lg" style={{ alignItems: 'center' }}>
        <NotificationBell count={3} size="md" />
        <NotificationBell dot size="md" />
        <NotificationBell size="md" />
      </HStack>
    </div>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell count={5} size="sm" />
            <Text size="xs" color="muted">sm</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell count={5} size="md" />
            <Text size="xs" color="muted">md</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell count={5} size="lg" />
            <Text size="xs" color="muted">lg</Text>
          </VStack>
        </HStack>
      ),
      code: `import { NotificationBell } from '@wisp-ui/react';

<NotificationBell count={5} size="sm" />
<NotificationBell count={5} size="md" />
<NotificationBell count={5} size="lg" />`,
    },
    {
      title: 'Badge Variants',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell count={3} />
            <Text size="xs" color="muted">Count</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell count={150} max={99} />
            <Text size="xs" color="muted">Overflow</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell dot />
            <Text size="xs" color="muted">Dot</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell />
            <Text size="xs" color="muted">None</Text>
          </VStack>
        </HStack>
      ),
      code: `<NotificationBell count={3} />
<NotificationBell count={150} max={99} />
<NotificationBell dot />
<NotificationBell />`,
    },
    {
      title: 'Interactive',
      render: <InteractiveBell />,
      code: `const [count, setCount] = useState(0);

// Bell shakes briefly each time count increases
<NotificationBell
  count={count}
  onPress={() => setCount(0)}
/>`,
    },
    {
      title: 'Active State',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell count={2} active={false} />
            <Text size="xs" color="muted">Default</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <NotificationBell count={2} active />
            <Text size="xs" color="muted">Active</Text>
          </VStack>
        </HStack>
      ),
      code: `<NotificationBell count={2} />
<NotificationBell count={2} active />`,
    },
  ],

  props: [
    { name: 'count', type: 'number', description: 'Number of unread notifications displayed as a badge.' },
    { name: 'max', type: 'number', description: 'Maximum count before showing overflow (e.g. "99+"). Default: 99.' },
    { name: 'dot', type: 'boolean', description: 'Show a minimal dot indicator instead of a count badge.' },
    { name: 'size', type: '"sm" | "md" | "lg"', description: 'Bell size preset. Default: "md".' },
    { name: 'animate', type: 'boolean', description: 'Whether to shake when the count increases. Default: true.' },
    { name: 'onPress', type: '() => void', description: 'Called when the bell button is pressed.' },
    { name: 'active', type: 'boolean', description: 'Whether the bell is in active/open state (shows active background).' },
  ],
};
