import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ModerationDashboard } from './ModerationDashboard';

const meta: Meta<typeof ModerationDashboard> = {
  title: 'Components/Community/ModerationDashboard',
  component: ModerationDashboard,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ModerationDashboard>;

const sampleStats = [
  { label: 'Total Warnings', value: 42, change: 5 },
  { label: 'Active Bans', value: 7, change: -2, color: 'danger' as const },
  { label: 'Timeouts Today', value: 3, change: 1, color: 'warning' as const },
  { label: 'Reports Pending', value: 12, color: 'default' as const },
];

const sampleActions = [
  {
    id: 'a1',
    type: 'warning' as const,
    actorName: 'Admin',
    targetName: 'SpamBot42',
    reason: 'Repeated spam messages',
    timestamp: '2 hours ago',
  },
  {
    id: 'a2',
    type: 'ban' as const,
    actorName: 'Moderator',
    targetName: 'ToxicPlayer',
    reason: 'Harassment',
    timestamp: '5 hours ago',
  },
  {
    id: 'a3',
    type: 'timeout' as const,
    actorName: 'AutoMod',
    targetName: 'CapsLockFan',
    reason: 'Excessive caps',
    timestamp: '1 day ago',
  },
  {
    id: 'a4',
    type: 'kick' as const,
    actorName: 'Admin',
    targetName: 'RuleBreaker',
    timestamp: '2 days ago',
  },
];

const sampleAlerts = [
  {
    id: 'e1',
    suspectedMemberName: 'NewAccount123',
    matchedBanName: 'ToxicPlayer',
    matchType: 'ip_pattern' as const,
    confidence: 'high' as const,
    timestamp: '1 hour ago',
  },
  {
    id: 'e2',
    suspectedMemberName: 'FreshJoin99',
    matchedBanName: 'SpamBot42',
    matchType: 'device_fingerprint' as const,
    confidence: 'medium' as const,
    timestamp: '3 hours ago',
  },
];

export const Default: Story = {
  render: () => (
    <ModerationDashboard
      stats={sampleStats}
      recentActions={sampleActions}
      banEvasionAlerts={sampleAlerts}
      onActionClick={(id) => console.log('Action:', id)}
      onAlertInvestigate={(id) => console.log('Investigate:', id)}
      onAlertDismiss={(id) => console.log('Dismiss:', id)}
    />
  ),
};

export const NoAlerts: Story = {
  name: 'No Ban Evasion Alerts',
  render: () => (
    <ModerationDashboard
      stats={sampleStats}
      recentActions={sampleActions}
      banEvasionAlerts={[]}
      onActionClick={(id) => console.log('Action:', id)}
    />
  ),
};

export const Empty: Story = {
  name: 'Empty State',
  render: () => (
    <ModerationDashboard
      stats={[]}
      recentActions={[]}
      banEvasionAlerts={[]}
    />
  ),
};
