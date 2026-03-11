import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AutoModSettings } from './AutoModSettings';

const meta: Meta<typeof AutoModSettings> = {
  title: 'Components/Community/AutoModSettings',
  component: AutoModSettings,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof AutoModSettings>;

const sampleRules = [
  {
    id: 'r1',
    name: 'Bad Words Filter',
    type: 'keyword' as const,
    pattern: 'badword|offensive',
    action: 'delete' as const,
    enabled: true,
  },
  {
    id: 'r2',
    name: 'Anti Spam',
    type: 'spam' as const,
    action: 'warn' as const,
    enabled: true,
  },
  {
    id: 'r3',
    name: 'Link Filter',
    type: 'link' as const,
    action: 'timeout' as const,
    enabled: false,
  },
];

const sampleThresholds = [
  { warningCount: 3, action: 'timeout' as const, duration: 3600 },
  { warningCount: 5, action: 'ban' as const },
];

export const Default: Story = {
  render: () => (
    <AutoModSettings
      rules={sampleRules}
      escalationThresholds={sampleThresholds}
      onRuleCreate={() => console.log('Create rule')}
      onRuleUpdate={(id, updates) => console.log('Update:', id, updates)}
      onRuleDelete={(id) => console.log('Delete:', id)}
      onRuleToggle={(id, enabled) => console.log('Toggle:', id, enabled)}
    />
  ),
};

export const Empty: Story = {
  name: 'Empty State',
  render: () => (
    <AutoModSettings
      rules={[]}
      escalationThresholds={[]}
      onRuleCreate={() => console.log('Create rule')}
    />
  ),
};
