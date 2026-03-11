import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NotificationSettingsPanel } from './NotificationSettingsPanel';
import type {
  NotificationTarget,
  NotificationSetting,
} from '@coexist/wisp-core/types/NotificationSettingsPanel.types';

const meta: Meta<typeof NotificationSettingsPanel> = {
  title: 'Components/Community/NotificationSettingsPanel',
  component: NotificationSettingsPanel,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationSettingsPanel>;

const sampleTargets: NotificationTarget[] = [
  { id: 'c1', name: 'Wisp Community', type: 'community' },
  { id: 'c2', name: 'Design Team', type: 'community' },
  { id: 's1', name: 'General', type: 'space' },
  { id: 's2', name: 'Engineering', type: 'space' },
  { id: 'ch1', name: '#announcements', type: 'channel' },
  { id: 'ch2', name: '#random', type: 'channel' },
  { id: 'ch3', name: '#dev', type: 'channel' },
];

const initialSettings: NotificationSetting[] = [
  { targetId: 'c1', level: 'all', muteUntil: null, suppressEveryone: false, suppressRoles: false },
  { targetId: 'c2', level: 'mentions', muteUntil: null, suppressEveryone: true, suppressRoles: false },
  { targetId: 's1', level: 'all', muteUntil: null, suppressEveryone: false, suppressRoles: false },
  { targetId: 's2', level: 'none', muteUntil: null, suppressEveryone: false, suppressRoles: true },
  { targetId: 'ch1', level: 'all', muteUntil: null, suppressEveryone: false, suppressRoles: false },
  { targetId: 'ch2', level: 'mentions', muteUntil: null, suppressEveryone: false, suppressRoles: false },
  { targetId: 'ch3', level: 'none', muteUntil: null, suppressEveryone: true, suppressRoles: true },
];

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [settings, setSettings] = useState(initialSettings);

      const handleChange = (targetId: string, updates: Partial<NotificationSetting>) => {
        setSettings((prev) =>
          prev.map((s) =>
            s.targetId === targetId ? { ...s, ...updates } : s,
          ),
        );
      };

      return (
        <NotificationSettingsPanel
          targets={sampleTargets}
          settings={settings}
          onSettingChange={handleChange}
          onClose={() => console.log('Close')}
        />
      );
    };
    return <Demo />;
  },
};

export const Loading: Story = {
  name: 'Loading',
  render: () => (
    <NotificationSettingsPanel
      targets={sampleTargets}
      settings={initialSettings}
      loading
    />
  ),
};

export const Empty: Story = {
  name: 'Empty',
  render: () => (
    <NotificationSettingsPanel
      targets={[]}
      settings={[]}
    />
  ),
};
