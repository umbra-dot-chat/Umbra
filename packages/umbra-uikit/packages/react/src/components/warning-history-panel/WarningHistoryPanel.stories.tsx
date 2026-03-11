import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WarningHistoryPanel } from './WarningHistoryPanel';

const meta: Meta<typeof WarningHistoryPanel> = {
  title: 'Components/Community/WarningHistoryPanel',
  component: WarningHistoryPanel,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    title: { control: 'text' },
    memberName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof WarningHistoryPanel>;

const sampleWarnings = [
  {
    id: 'w1',
    reason: 'Spam messages in general channel',
    issuedBy: 'Admin',
    issuedAt: '2025-01-01',
    expiresAt: '2025-06-01',
    active: true,
  },
  {
    id: 'w2',
    reason: 'Inappropriate language',
    issuedBy: 'Moderator',
    issuedAt: '2024-12-15',
    active: false,
  },
  {
    id: 'w3',
    reason: 'Harassing other members',
    issuedBy: 'Admin',
    issuedAt: '2024-11-20',
    expiresAt: '2025-02-20',
    active: true,
  },
];

export const Default: Story = {
  render: () => (
    <WarningHistoryPanel
      memberName="JaneDoe"
      warnings={sampleWarnings}
      onDeleteWarning={(id) => console.log('Delete:', id)}
      onClose={() => console.log('Close')}
    />
  ),
};

export const Empty: Story = {
  name: 'Empty State',
  render: () => (
    <WarningHistoryPanel
      memberName="GoodUser"
      warnings={[]}
      onClose={() => console.log('Close')}
    />
  ),
};

export const NoDelete: Story = {
  name: 'Without Delete',
  render: () => (
    <WarningHistoryPanel
      memberName="JaneDoe"
      warnings={sampleWarnings}
    />
  ),
};
