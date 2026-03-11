import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '@wisp-ui/react';
import { avatarSizes, avatarShapes, avatarStatuses } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Camera } from 'lucide-react';

const meta: Meta<typeof Avatar> = {
  title: 'React/Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { size: 'md', shape: 'circle' },
  argTypes: {
    size: { control: 'select', options: [...avatarSizes] },
    shape: { control: 'select', options: [...avatarShapes] },
    status: { control: 'select', options: [undefined, ...avatarStatuses] },
    skeleton: { control: 'boolean' },
    src: { control: 'text' },
    name: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
    <Text size="xs" color="tertiary" weight="medium" style={{ width: 60, flexShrink: 0, textAlign: 'right' }}>
      {label}
    </Text>
    {children}
  </div>
);

export const Default: Story = {
  args: { name: 'John Doe' },
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {avatarSizes.map((size) => (
        <Row key={size} label={size}>
          <Avatar size={size} name="John Doe" />
          <Avatar size={size} name="Jane Smith" />
          <Avatar size={size} />
        </Row>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Circle (default)</SectionLabel>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar shape="circle" name="AB" size="lg" />
        <Avatar shape="circle" name="CD" size="lg" />
        <Avatar shape="circle" size="lg" />
      </div>
      <SectionLabel>Square</SectionLabel>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar shape="square" name="AB" size="lg" />
        <Avatar shape="square" name="CD" size="lg" />
        <Avatar shape="square" size="lg" />
      </div>
    </div>
  ),
};

export const WithStatus: Story = {
  name: 'With Status',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {avatarStatuses.map((status) => (
        <Row key={status} label={status}>
          <Avatar size="lg" name="John Doe" status={status} />
          <Avatar size="lg" name="John Doe" status={status} shape="square" />
        </Row>
      ))}
    </div>
  ),
};

export const FallbackIcon: Story = {
  name: 'Custom Fallback Icon',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Avatar size="lg" />
      <Avatar size="lg" fallbackIcon={Camera} />
    </div>
  ),
};

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {avatarSizes.map((size) => (
        <Avatar key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>User list item</SectionLabel>
      {['Alice Johnson', 'Bob Smith', 'Carol Williams'].map((name, i) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={name} size="md" status={(['online', 'away', 'busy'] as const)[i]} />
          <div>
            <Text size="sm" weight="medium">{name}</Text>
            <Text size="xs" color="secondary">{(['Active now', 'Away', 'Do not disturb'] as const)[i]}</Text>
          </div>
        </div>
      ))}

      <SectionLabel>Avatar group</SectionLabel>
      <div style={{ display: 'flex' }}>
        {['Alice Johnson', 'Bob Smith', 'Carol Williams', 'Dan Lee'].map((name, i) => (
          <div key={name} style={{ marginLeft: i > 0 ? -8 : 0 }}>
            <Avatar name={name} size="md" />
          </div>
        ))}
      </div>
    </div>
  ),
};
