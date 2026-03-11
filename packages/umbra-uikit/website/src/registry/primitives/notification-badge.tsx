import React from 'react';
import { NotificationBadge, HStack, VStack, Text, Button } from '@wisp-ui/react';
import { Bell, Mail, ShoppingCart } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const notificationBadgeEntry: ComponentEntry = {
  slug: 'notification-badge',
  name: 'NotificationBadge',
  category: 'primitives',
  subcategory: 'Badges & Tags',
  description:
    'Count or dot badge overlay anchored to an icon, avatar, or button. Supports 5 color variants, max overflow, dot mode, and pulse animation.',
  variantCount: 5,
  keywords: ['notification', 'badge', 'count', 'unread', 'dot', 'alert', 'pulse'],

  cardPreview: (
    <HStack gap="lg" align="center">
      <NotificationBadge count={3} color="danger">
        <Bell size={24} />
      </NotificationBadge>
      <NotificationBadge dot color="success">
        <Mail size={24} />
      </NotificationBadge>
      <NotificationBadge count={12} color="info">
        <ShoppingCart size={24} />
      </NotificationBadge>
    </HStack>
  ),

  examples: [
    {
      title: 'Basic Count',
      render: (
        <HStack gap="xl" align="center">
          <NotificationBadge count={5}>
            <Bell size={24} />
          </NotificationBadge>
          <NotificationBadge count={12}>
            <Mail size={24} />
          </NotificationBadge>
          <NotificationBadge count={1}>
            <ShoppingCart size={24} />
          </NotificationBadge>
        </HStack>
      ),
      code: `import { NotificationBadge } from '@wisp-ui/react';
import { Bell, Mail, ShoppingCart } from 'lucide-react';

<NotificationBadge count={5}>
  <Bell size={24} />
</NotificationBadge>
<NotificationBadge count={12}>
  <Mail size={24} />
</NotificationBadge>
<NotificationBadge count={1}>
  <ShoppingCart size={24} />
</NotificationBadge>`,
    },
    {
      title: 'Dot Mode',
      render: (
        <HStack gap="xl" align="center">
          <NotificationBadge dot color="danger">
            <Bell size={24} />
          </NotificationBadge>
          <NotificationBadge dot color="success">
            <Mail size={24} />
          </NotificationBadge>
          <NotificationBadge dot color="info">
            <ShoppingCart size={24} />
          </NotificationBadge>
        </HStack>
      ),
      code: `<NotificationBadge dot color="danger">
  <Bell size={24} />
</NotificationBadge>
<NotificationBadge dot color="success">
  <Mail size={24} />
</NotificationBadge>
<NotificationBadge dot color="info">
  <ShoppingCart size={24} />
</NotificationBadge>`,
    },
    {
      title: 'Max Overflow',
      render: (
        <HStack gap="xl" align="center">
          <NotificationBadge count={150} max={99}>
            <Bell size={24} />
          </NotificationBadge>
          <NotificationBadge count={1000} max={99}>
            <Mail size={24} />
          </NotificationBadge>
          <NotificationBadge count={50} max={9}>
            <ShoppingCart size={24} />
          </NotificationBadge>
        </HStack>
      ),
      code: `<NotificationBadge count={150} max={99}>
  <Bell size={24} />
</NotificationBadge>
<NotificationBadge count={1000} max={99}>
  <Mail size={24} />
</NotificationBadge>
<NotificationBadge count={50} max={9}>
  <ShoppingCart size={24} />
</NotificationBadge>`,
    },
    {
      title: 'Colors',
      render: (
        <HStack gap="xl" align="center">
          {(['danger', 'warning', 'success', 'info', 'default'] as const).map((c) => (
            <VStack key={c} gap="xs" align="center">
              <NotificationBadge count={8} color={c}>
                <Bell size={24} />
              </NotificationBadge>
              <Text size="xs" color="tertiary">{c}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `<NotificationBadge count={8} color="danger">
  <Bell size={24} />
</NotificationBadge>
<NotificationBadge count={8} color="warning">
  <Bell size={24} />
</NotificationBadge>
<NotificationBadge count={8} color="success">
  <Bell size={24} />
</NotificationBadge>
<NotificationBadge count={8} color="info">
  <Bell size={24} />
</NotificationBadge>
<NotificationBadge count={8} color="default">
  <Bell size={24} />
</NotificationBadge>`,
    },
    {
      title: 'Pulse Animation',
      render: (
        <HStack gap="xl" align="center">
          <NotificationBadge count={3} pulse>
            <Bell size={24} />
          </NotificationBadge>
          <NotificationBadge dot pulse color="success">
            <Mail size={24} />
          </NotificationBadge>
        </HStack>
      ),
      code: `<NotificationBadge count={3} pulse>
  <Bell size={24} />
</NotificationBadge>
<NotificationBadge dot pulse color="success">
  <Mail size={24} />
</NotificationBadge>`,
    },
  ],

  props: [
    { name: 'count', type: 'number', description: 'Numeric count displayed in the badge.' },
    { name: 'max', type: 'number', default: '99', description: 'Maximum count before showing overflow (e.g. 99+).' },
    { name: 'dot', type: 'boolean', default: 'false', description: 'Render a small dot instead of a count.' },
    { name: 'color', type: "'danger' | 'warning' | 'success' | 'info' | 'default'", default: "'danger'", description: 'Semantic color variant.' },
    { name: 'invisible', type: 'boolean', default: 'false', description: 'Hide the badge completely.' },
    { name: 'pulse', type: 'boolean', default: 'false', description: 'Apply a pulsing animation to draw attention.' },
    { name: 'children', type: 'React.ReactNode', description: 'The element the badge is anchored to.' },
  ],
};
