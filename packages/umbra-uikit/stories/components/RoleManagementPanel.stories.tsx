/**
 * RoleManagementPanel -- Top-level Storybook stories for the admin role management panel.
 *
 * @module stories/components/RoleManagementPanel
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RoleManagementPanel } from '@wisp-ui/react';
import type { ManagedRole, RolePermissionCategory } from '@wisp-ui/react';

const meta: Meta<typeof RoleManagementPanel> = {
  title: 'React/Components/Community/RoleManagementPanel',
  component: RoleManagementPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: 600, width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RoleManagementPanel>;

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const sampleRoles: ManagedRole[] = [
  {
    id: 'role-owner',
    name: 'Owner',
    color: '#e74c3c',
    position: 0,
    permissions: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true, '10': true, '11': true },
    memberCount: 1,
    hoisted: true,
    mentionable: false,
  },
  {
    id: 'role-admin',
    name: 'Admin',
    color: '#e67e22',
    position: 1,
    permissions: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true, '10': true },
    memberCount: 3,
    hoisted: true,
    mentionable: true,
  },
  {
    id: 'role-mod',
    name: 'Moderator',
    color: '#2ecc71',
    position: 2,
    permissions: { '0': true, '1': false, '2': false, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true },
    memberCount: 7,
    hoisted: true,
    mentionable: true,
  },
  {
    id: 'role-vip',
    name: 'VIP',
    color: '#9b59b6',
    position: 3,
    permissions: { '0': true, '4': true, '5': true, '6': true, '8': true, '9': true },
    memberCount: 15,
    hoisted: false,
    mentionable: false,
  },
  {
    id: 'role-member',
    name: 'Member',
    color: '#3498db',
    position: 4,
    permissions: { '0': true, '4': true, '5': true, '8': true, '9': true },
    memberCount: 45,
    hoisted: false,
    mentionable: false,
  },
  {
    id: 'role-everyone',
    name: '@everyone',
    color: '#95a5a6',
    position: 99,
    permissions: { '0': true },
    memberCount: 120,
    hoisted: false,
    mentionable: false,
    isDefault: true,
  },
];

const sampleCategories: RolePermissionCategory[] = [
  {
    name: 'General',
    permissions: [
      { key: '0', label: 'View Channels', description: 'Allows viewing text and voice channels' },
      { key: '1', label: 'Manage Channels', description: 'Allows creating, editing, and deleting channels', dangerous: true },
      { key: '2', label: 'Manage Roles', description: 'Allows creating and managing roles below this one', dangerous: true },
      { key: '3', label: 'Manage Server', description: 'Allows editing server name, region, and icon', dangerous: true },
    ],
  },
  {
    name: 'Text',
    permissions: [
      { key: '4', label: 'Send Messages', description: 'Allows sending messages in text channels' },
      { key: '5', label: 'Embed Links', description: 'Allows links to show embedded content' },
      { key: '6', label: 'Attach Files', description: 'Allows uploading files and images' },
      { key: '7', label: 'Manage Messages', description: 'Allows deleting and pinning messages from others', dangerous: true },
    ],
  },
  {
    name: 'Voice',
    permissions: [
      { key: '8', label: 'Connect', description: 'Allows joining voice channels' },
      { key: '9', label: 'Speak', description: 'Allows speaking in voice channels' },
      { key: '10', label: 'Mute Members', description: 'Allows server-muting members in voice channels', dangerous: true },
      { key: '11', label: 'Deafen Members', description: 'Allows server-deafening members in voice channels', dangerous: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Default (fully interactive)
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const [roles, setRoles] = useState(sampleRoles);

    return (
      <RoleManagementPanel
        roles={roles}
        permissionCategories={sampleCategories}
        selectedRoleId={selectedId}
        onRoleSelect={setSelectedId}
        onRoleUpdate={(id, updates) => {
          setRoles((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          );
        }}
        onRoleCreate={() => {
          const newRole: ManagedRole = {
            id: `role-${Date.now()}`,
            name: 'New Role',
            color: '#7f8c8d',
            position: roles.length,
            permissions: {},
            memberCount: 0,
          };
          setRoles((prev) => [...prev, newRole]);
          setSelectedId(newRole.id);
        }}
        onRoleDelete={(id) => {
          setRoles((prev) => prev.filter((r) => r.id !== id));
          setSelectedId(undefined);
        }}
        onPermissionToggle={(roleId, permKey, value) => {
          setRoles((prev) =>
            prev.map((r) => {
              if (r.id !== roleId) return r;
              return {
                ...r,
                permissions: { ...r.permissions, [permKey]: value },
              };
            }),
          );
        }}
        onRoleReorder={(roleId, newPosition) => {
          setRoles((prev) => {
            const updated = prev.map((r) => {
              if (r.id === roleId) return { ...r, position: newPosition };
              return r;
            });
            return updated;
          });
        }}
      />
    );
  },
};

// ---------------------------------------------------------------------------
// WithSelectedRole
// ---------------------------------------------------------------------------

export const WithSelectedRole: Story = {
  name: 'With Selected Role',
  render: () => {
    const [selectedId, setSelectedId] = useState<string | undefined>('role-admin');
    const [roles, setRoles] = useState(sampleRoles);

    return (
      <RoleManagementPanel
        roles={roles}
        permissionCategories={sampleCategories}
        selectedRoleId={selectedId}
        onRoleSelect={setSelectedId}
        onRoleUpdate={(id, updates) => {
          setRoles((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          );
        }}
        onRoleCreate={() => {
          const newRole: ManagedRole = {
            id: `role-${Date.now()}`,
            name: 'New Role',
            color: '#7f8c8d',
            position: roles.length,
            permissions: {},
            memberCount: 0,
          };
          setRoles((prev) => [...prev, newRole]);
          setSelectedId(newRole.id);
        }}
        onRoleDelete={(id) => {
          setRoles((prev) => prev.filter((r) => r.id !== id));
          setSelectedId(undefined);
        }}
        onPermissionToggle={(roleId, permKey, value) => {
          setRoles((prev) =>
            prev.map((r) => {
              if (r.id !== roleId) return r;
              return {
                ...r,
                permissions: { ...r.permissions, [permKey]: value },
              };
            }),
          );
        }}
        onRoleReorder={(roleId, newPosition) => {
          setRoles((prev) =>
            prev.map((r) => (r.id === roleId ? { ...r, position: newPosition } : r)),
          );
        }}
      />
    );
  },
};

// ---------------------------------------------------------------------------
// ReadOnly (no create/delete/reorder)
// ---------------------------------------------------------------------------

export const ReadOnly: Story = {
  name: 'Read Only',
  render: () => {
    const [selectedId, setSelectedId] = useState<string | undefined>('role-mod');

    return (
      <RoleManagementPanel
        roles={sampleRoles}
        permissionCategories={sampleCategories}
        selectedRoleId={selectedId}
        onRoleSelect={setSelectedId}
      />
    );
  },
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  args: {
    roles: sampleRoles,
    permissionCategories: sampleCategories,
    loading: true,
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  args: {
    roles: sampleRoles,
    permissionCategories: sampleCategories,
    skeleton: true,
  },
};
