import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ListItem } from '@wisp-ui/react';
import { listItemSizes } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Icon } from '@wisp-ui/react';
import { Avatar } from '@wisp-ui/react';
import { Badge } from '@wisp-ui/react';
import { VStack } from '@wisp-ui/react';
import { Separator } from '@wisp-ui/react';
import { User, Mail, Bell, FileText, Settings, ChevronRight, Star, MoreHorizontal } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ListItem> = {
  title: 'React/Layouts/ListItem',
  component: ListItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ListItem>;

// ---------------------------------------------------------------------------
// 1. Size Variants
// ---------------------------------------------------------------------------

export const SizeVariants: Story = {
  name: 'Size Variants',
  render: () => (
    <VStack gap="sm" style={{ maxWidth: 400 }}>
      {listItemSizes.map((s) => (
        <ListItem
          key={s}
          size={s}
          leading={<Icon icon={User} size="sm" />}
          trailing={<Text size="xs" color="tertiary">{s}</Text>}
        >
          <Text size="sm">Size &quot;{s}&quot;</Text>
        </ListItem>
      ))}
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Avatar & Badge
// ---------------------------------------------------------------------------

export const WithAvatarAndBadge: Story = {
  name: 'Avatar & Badge',
  render: () => (
    <VStack gap="xs" style={{ maxWidth: 400 }}>
      <ListItem
        leading={<Avatar size="sm" name="Alice Johnson" />}
        trailing={<Badge size="sm" variant="status" color="success">Online</Badge>}
      >
        <Text size="sm" weight="medium">Alice Johnson</Text>
        <Text size="xs" color="secondary">Product Designer</Text>
      </ListItem>
      <Separator spacing="none" />
      <ListItem
        leading={<Avatar size="sm" name="Bob Smith" />}
        trailing={<Badge size="sm" variant="status" color="default">Offline</Badge>}
      >
        <Text size="sm" weight="medium">Bob Smith</Text>
        <Text size="xs" color="secondary">Engineer</Text>
      </ListItem>
      <Separator spacing="none" />
      <ListItem
        leading={<Avatar size="sm" name="Carol Davis" />}
        trailing={<Badge size="sm" variant="status" color="warning">Away</Badge>}
      >
        <Text size="sm" weight="medium">Carol Davis</Text>
        <Text size="xs" color="secondary">Project Manager</Text>
      </ListItem>
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 3. Interactive Items
// ---------------------------------------------------------------------------

export const Interactive: Story = {
  name: 'Interactive',
  render: () => (
    <VStack gap="xs" style={{ maxWidth: 400 }}>
      {[
        { icon: Mail, label: 'Messages', count: 5 },
        { icon: Bell, label: 'Notifications', count: 12 },
        { icon: FileText, label: 'Documents', count: 0 },
        { icon: Settings, label: 'Settings', count: 0 },
      ].map((item) => (
        <ListItem
          key={item.label}
          interactive
          leading={<Icon icon={item.icon} size="sm" />}
          trailing={
            <>
              {item.count > 0 && (
                <Badge size="sm" shape="pill">{item.count}</Badge>
              )}
              <Icon icon={ChevronRight} size="xs" color="tertiary" />
            </>
          }
        >
          <Text size="sm" weight="medium">{item.label}</Text>
        </ListItem>
      ))}
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 4. Active & Disabled States
// ---------------------------------------------------------------------------

export const States: Story = {
  name: 'Active & Disabled',
  render: () => (
    <VStack gap="xs" style={{ maxWidth: 400 }}>
      <ListItem
        interactive
        leading={<Icon icon={Star} size="sm" />}
        trailing={<Icon icon={ChevronRight} size="xs" color="tertiary" />}
      >
        <Text size="sm" weight="medium">Normal</Text>
      </ListItem>
      <ListItem
        interactive
        active
        leading={<Icon icon={Star} size="sm" />}
        trailing={<Icon icon={ChevronRight} size="xs" color="tertiary" />}
      >
        <Text size="sm" weight="medium">Active / Selected</Text>
      </ListItem>
      <ListItem
        interactive
        disabled
        leading={<Icon icon={Star} size="sm" />}
        trailing={<Icon icon={ChevronRight} size="xs" color="tertiary" />}
      >
        <Text size="sm" weight="medium">Disabled</Text>
      </ListItem>
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 5. Alignment Variants
// ---------------------------------------------------------------------------

export const AlignmentVariants: Story = {
  name: 'Alignment',
  render: () => (
    <VStack gap="lg" style={{ maxWidth: 400 }}>
      {(['start', 'center', 'end'] as const).map((a) => (
        <VStack key={a} gap="xs">
          <Text size="xs" color="tertiary" weight="semibold" style={{ textTransform: 'uppercase' }}>
            align=&quot;{a}&quot;
          </Text>
          <ListItem
            size="lg"
            align={a}
            leading={<Avatar size="md" name="User" />}
            trailing={<Icon icon={MoreHorizontal} size="sm" color="tertiary" />}
          >
            <Text size="sm" weight="medium">User Name</Text>
            <Text size="xs" color="secondary">This is a longer description that shows how alignment works with multi-line content in the item.</Text>
          </ListItem>
        </VStack>
      ))}
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 6. Notification List Pattern
// ---------------------------------------------------------------------------

export const NotificationPattern: Story = {
  name: 'Notification List',
  render: () => {
    const notifications = [
      { title: 'New comment on your post', time: '2m ago', read: false },
      { title: 'Alice mentioned you', time: '1h ago', read: false },
      { title: 'Build succeeded', time: '3h ago', read: true },
      { title: 'Meeting reminder', time: 'Yesterday', read: true },
    ];

    return (
      <VStack gap="none" style={{ maxWidth: 400 }}>
        {notifications.map((n, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Separator spacing="none" />}
            <ListItem
              interactive
              leading={
                <div style={{ position: 'relative' }}>
                  <Icon icon={Bell} size="sm" color={n.read ? 'tertiary' : 'primary'} />
                  {!n.read && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                      }}
                    />
                  )}
                </div>
              }
              trailing={<Text size="xs" color="tertiary">{n.time}</Text>}
            >
              <Text
                size="sm"
                weight={n.read ? 'regular' : 'medium'}
                color={n.read ? 'secondary' : 'primary'}
              >
                {n.title}
              </Text>
            </ListItem>
          </React.Fragment>
        ))}
      </VStack>
    );
  },
};
