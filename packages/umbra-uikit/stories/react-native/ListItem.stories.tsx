import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ListItem, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof ListItem> = {
  title: 'React Native/Layouts/ListItem',
  component: ListItem,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    interactive: { control: 'boolean' },
    active: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

/** Simple placeholder icon for demos. */
const PlaceholderIcon = ({ size = 20, color = '#94A0B8' }: { size?: number; color?: string }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity: 0.5,
    }}
  />
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360 }}>
      <ListItem>
        <Text>Notifications</Text>
      </ListItem>
      <ListItem>
        <Text>Privacy</Text>
      </ListItem>
      <ListItem>
        <Text>Appearance</Text>
      </ListItem>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Description
// ---------------------------------------------------------------------------

export const WithDescription: Story = {
  name: 'With Description',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Title and secondary text
      </div>
      <ListItem>
        <Text weight="medium">Notifications</Text>
        <Text size="sm" color="secondary">Manage your notification preferences</Text>
      </ListItem>
      <ListItem>
        <Text weight="medium">Privacy</Text>
        <Text size="sm" color="secondary">Control your privacy settings</Text>
      </ListItem>
      <ListItem>
        <Text weight="medium">Storage</Text>
        <Text size="sm" color="secondary">12.4 GB used of 15 GB</Text>
      </ListItem>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Icon
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Leading and trailing slots
      </div>
      <ListItem leading={<PlaceholderIcon color="#3b82f6" />}>
        <Text weight="medium">Inbox</Text>
      </ListItem>
      <ListItem
        leading={<PlaceholderIcon color="#8b5cf6" />}
        trailing={<Text size="sm" color="secondary">24</Text>}
      >
        <Text weight="medium">Messages</Text>
      </ListItem>
      <ListItem
        leading={<PlaceholderIcon color="#ec4899" />}
        trailing={<Text size="sm" color="secondary">3</Text>}
      >
        <Text weight="medium">Alerts</Text>
      </ListItem>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Pressed
// ---------------------------------------------------------------------------

export const Pressed: Story = {
  name: 'Pressed / Interactive',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Interactive items with press feedback
      </div>
      <ListItem interactive onPress={() => {}} leading={<PlaceholderIcon color="#3b82f6" />}>
        <Text weight="medium">General</Text>
        <Text size="sm" color="secondary">App language, region, defaults</Text>
      </ListItem>
      <ListItem interactive active leading={<PlaceholderIcon color="#8b5cf6" />}>
        <Text weight="medium">Account (active)</Text>
        <Text size="sm" color="secondary">Manage your account details</Text>
      </ListItem>
      <ListItem interactive disabled leading={<PlaceholderIcon color="#94A0B8" />}>
        <Text weight="medium">Admin (disabled)</Text>
        <Text size="sm" color="secondary">Requires elevated permissions</Text>
      </ListItem>
    </div>
  ),
};
