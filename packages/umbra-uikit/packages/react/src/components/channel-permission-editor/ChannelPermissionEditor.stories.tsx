import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChannelPermissionEditor } from './ChannelPermissionEditor';
import type {
  PermissionOverrideTarget,
  PermissionOverride,
  OverrideValue,
} from '@coexist/wisp-core/types/ChannelPermissionEditor.types';

const meta: Meta<typeof ChannelPermissionEditor> = {
  title: 'Components/Community/ChannelPermissionEditor',
  component: ChannelPermissionEditor,
  tags: ['autodocs'],
  argTypes: {
    saving: { control: 'boolean' },
    title: { control: 'text' },
    channelName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ChannelPermissionEditor>;

const sampleTargets: PermissionOverrideTarget[] = [
  { id: 'r1', name: 'Admin', type: 'role', color: '#ef4444' },
  { id: 'r2', name: 'Moderator', type: 'role', color: '#3b82f6' },
  { id: 'r3', name: 'Member', type: 'role', color: '#6b7280' },
  { id: 'm1', name: 'Alice', type: 'member' },
];

const initialPerms: PermissionOverride[] = [
  { key: 'view_channel', label: 'View Channel', description: 'Allows viewing the channel.', category: 'General', value: 'allow' },
  { key: 'send_messages', label: 'Send Messages', description: 'Allows sending messages.', category: 'Text', value: 'allow' },
  { key: 'attach_files', label: 'Attach Files', description: 'Allows uploading files.', category: 'Text', value: 'inherit' },
  { key: 'manage_messages', label: 'Manage Messages', description: 'Allows deleting and pinning messages.', category: 'Text', value: 'inherit', dangerous: true },
  { key: 'connect', label: 'Connect', description: 'Allows connecting to voice.', category: 'Voice', value: 'allow' },
  { key: 'speak', label: 'Speak', description: 'Allows speaking in voice.', category: 'Voice', value: 'inherit' },
  { key: 'mute_members', label: 'Mute Members', description: 'Allows muting others.', category: 'Voice', value: 'deny', dangerous: true },
];

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [selectedId, setSelectedId] = useState<string>('r1');
      const [perms, setPerms] = useState(initialPerms);

      const handlePermChange = (_targetId: string, permKey: string, value: OverrideValue) => {
        setPerms((prev) =>
          prev.map((p) => (p.key === permKey ? { ...p, value } : p)),
        );
      };

      return (
        <ChannelPermissionEditor
          channelName="#general"
          targets={sampleTargets}
          selectedTargetId={selectedId}
          onTargetSelect={setSelectedId}
          onAddTarget={() => console.log('Add target')}
          onRemoveTarget={(id) => console.log('Remove:', id)}
          permissions={perms}
          onPermissionChange={handlePermChange}
          onSave={() => console.log('Save')}
          onReset={() => setPerms(initialPerms)}
        />
      );
    };
    return <Demo />;
  },
};

export const NoSelection: Story = {
  name: 'No Selection',
  render: () => (
    <ChannelPermissionEditor
      channelName="#announcements"
      targets={sampleTargets}
      permissions={initialPerms}
      onSave={() => {}}
      onReset={() => {}}
    />
  ),
};

export const Saving: Story = {
  name: 'Saving',
  render: () => (
    <ChannelPermissionEditor
      channelName="#dev"
      targets={sampleTargets}
      selectedTargetId="r2"
      permissions={initialPerms}
      onSave={() => {}}
      onReset={() => {}}
      saving
    />
  ),
};
