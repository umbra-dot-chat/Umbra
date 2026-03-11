import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ActiveTimeoutsBadge } from './ActiveTimeoutsBadge';

const meta: Meta<typeof ActiveTimeoutsBadge> = {
  title: 'Components/Community/ActiveTimeoutsBadge',
  component: ActiveTimeoutsBadge,
  tags: ['autodocs'],
  argTypes: {
    active: { control: 'boolean' },
    type: { control: 'select', options: ['mute', 'restrict'] },
    size: { control: 'select', options: ['xs', 'sm', 'md'] },
    expiresAt: { control: 'text' },
    reason: { control: 'text' },
    showTooltip: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ActiveTimeoutsBadge>;

export const Default: Story = {
  args: {
    active: true,
    type: 'mute',
    size: 'sm',
    reason: 'Spam messages',
    expiresAt: '2025-03-01T12:00:00Z',
  },
};

export const Restricted: Story = {
  name: 'Restricted',
  args: {
    active: true,
    type: 'restrict',
    size: 'sm',
    reason: 'Repeated violations',
    expiresAt: '2025-04-15T00:00:00Z',
  },
};

export const Sizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <ActiveTimeoutsBadge active type="mute" size="xs" />
      <ActiveTimeoutsBadge active type="mute" size="sm" />
      <ActiveTimeoutsBadge active type="mute" size="md" />
    </div>
  ),
};

export const Inactive: Story = {
  name: 'Inactive (hidden)',
  args: {
    active: false,
    type: 'mute',
  },
};
