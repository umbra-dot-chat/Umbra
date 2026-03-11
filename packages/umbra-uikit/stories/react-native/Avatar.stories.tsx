import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '@wisp-ui/react-native';

const meta: Meta<typeof Avatar> = {
  title: 'React Native/Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'square'] },
    status: { control: 'select', options: [undefined, 'online', 'offline', 'busy', 'away'] },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    src: 'https://i.pravatar.cc/160?img=12',
    alt: 'User avatar',
    size: 'md',
    shape: 'circle',
  },
};

// ---------------------------------------------------------------------------
// 2. With Initials
// ---------------------------------------------------------------------------

export const WithInitials: Story = {
  name: 'With Initials',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Initials from name</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name="Alice Johnson" size="md" />
        <Avatar name="Bob Smith" size="md" />
        <Avatar name="Charlie" size="md" />
        <Avatar name="Diana Prince" size="md" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Fallback (no name or image)</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar size="sm" />
        <Avatar size="md" />
        <Avatar size="lg" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>With image</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Avatar src={`https://i.pravatar.cc/160?img=12`} size={size} alt={size} />
            <span style={{ fontSize: 10, color: '#94A0B8' }}>{size}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>With initials</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Avatar name="Alex Kim" size={size} />
            <span style={{ fontSize: 10, color: '#94A0B8' }}>{size}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Shapes
// ---------------------------------------------------------------------------

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Circle (default)</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar src="https://i.pravatar.cc/160?img=5" shape="circle" size="md" />
        <Avatar name="Alice Johnson" shape="circle" size="md" />
        <Avatar shape="circle" size="md" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Square</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar src="https://i.pravatar.cc/160?img=5" shape="square" size="md" />
        <Avatar name="Alice Johnson" shape="square" size="md" />
        <Avatar shape="square" size="md" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Shape + status comparison</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {(['online', 'offline', 'busy', 'away'] as const).map((status) => (
          <div key={status} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar name="AK" shape="circle" size="lg" status={status} />
            <Avatar name="AK" shape="square" size="lg" status={status} />
          </div>
        ))}
      </div>
    </div>
  ),
};
