import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RoleCreateDialog } from './RoleCreateDialog';
import { Button } from '../../primitives/button';
import type { RolePermissionCategory } from '@coexist/wisp-core/types/RoleCreateDialog.types';

const sampleCategories: RolePermissionCategory[] = [
  {
    name: 'General',
    permissions: [
      { key: 'view_channels', label: 'View Channels', description: 'Allows viewing text and voice channels' },
      { key: 'send_messages', label: 'Send Messages', description: 'Allows sending messages in text channels' },
      { key: 'embed_links', label: 'Embed Links', description: 'Allows embedding links in messages' },
      { key: 'attach_files', label: 'Attach Files', description: 'Allows uploading files' },
    ],
  },
  {
    name: 'Moderation',
    permissions: [
      { key: 'kick_members', label: 'Kick Members', description: 'Allows kicking members', dangerous: true },
      { key: 'ban_members', label: 'Ban Members', description: 'Allows banning members', dangerous: true },
      { key: 'manage_messages', label: 'Manage Messages', description: 'Allows deleting messages from others' },
      { key: 'mute_members', label: 'Mute Members', description: 'Allows muting members in voice channels' },
    ],
  },
  {
    name: 'Administration',
    permissions: [
      { key: 'administrator', label: 'Administrator', description: 'Grants all permissions', dangerous: true },
      { key: 'manage_roles', label: 'Manage Roles', description: 'Allows creating and editing roles', dangerous: true },
      { key: 'manage_channels', label: 'Manage Channels', description: 'Allows creating and editing channels' },
    ],
  },
];

const meta: Meta<typeof RoleCreateDialog> = {
  title: 'Components/Community/RoleCreateDialog',
  component: RoleCreateDialog,
  tags: ['autodocs'],
  argTypes: {
    submitting: { control: 'boolean' },
    error: { control: 'text' },
    title: { control: 'text' },
    defaultColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof RoleCreateDialog>;

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Create Role</Button>
          <RoleCreateDialog
            open={open}
            onClose={() => setOpen(false)}
            onSubmit={(data) => {
              console.log('Submit:', data);
              setOpen(false);
            }}
            permissionCategories={sampleCategories}
          />
        </>
      );
    };
    return <Demo />;
  },
};

export const WithError: Story = {
  name: 'With Error',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Create Role (Error)</Button>
          <RoleCreateDialog
            open={open}
            onClose={() => setOpen(false)}
            error="A role with this name already exists."
            onSubmit={(data) => console.log('Submit:', data)}
            permissionCategories={sampleCategories}
          />
        </>
      );
    };
    return <Demo />;
  },
};

export const Submitting: Story = {
  name: 'Submitting',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Create Role (Loading)</Button>
          <RoleCreateDialog
            open={open}
            onClose={() => setOpen(false)}
            submitting
            onSubmit={(data) => console.log('Submit:', data)}
            permissionCategories={sampleCategories}
          />
        </>
      );
    };
    return <Demo />;
  },
};

export const CustomColor: Story = {
  name: 'Custom Default Color',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Create Role (Custom Color)</Button>
          <RoleCreateDialog
            open={open}
            onClose={() => setOpen(false)}
            onSubmit={(data) => {
              console.log('Submit:', data);
              setOpen(false);
            }}
            permissionCategories={sampleCategories}
            defaultColor="#E74C3C"
            colorPresets={['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C']}
          />
        </>
      );
    };
    return <Demo />;
  },
};
