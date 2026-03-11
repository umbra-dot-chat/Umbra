/**
 * RoleManagementPanel -- Stories for the admin role management panel.
 *
 * @module stories/role-management-panel
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RoleManagementPanel } from './RoleManagementPanel';
import type { ManagedRole, RolePermissionCategory } from '@coexist/wisp-core/types/RoleManagementPanel.types';

const meta: Meta<typeof RoleManagementPanel> = {
  title: 'Components/Community/RoleManagementPanel',
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
    color: '#f1c40f',
    position: 0,
    permissions: 0b11111111,
    memberCount: 1,
    hoisted: true,
    mentionable: false,
  },
  {
    id: 'role-admin',
    name: 'Admin',
    color: '#e74c3c',
    position: 1,
    permissions: 0b01111111,
    memberCount: 3,
    hoisted: true,
    mentionable: true,
  },
  {
    id: 'role-mod',
    name: 'Moderator',
    color: '#3498db',
    position: 2,
    permissions: 0b00111111,
    memberCount: 7,
    hoisted: true,
    mentionable: true,
  },
  {
    id: 'role-vip',
    name: 'VIP',
    color: '#9b59b6',
    position: 3,
    permissions: 0b00001111,
    memberCount: 15,
    hoisted: false,
    mentionable: false,
  },
  {
    id: 'role-member',
    name: 'Member',
    color: '#2ecc71',
    position: 4,
    permissions: 0b00000111,
    memberCount: 45,
    hoisted: false,
    mentionable: false,
  },
  {
    id: 'role-everyone',
    name: '@everyone',
    color: '#95a5a6',
    position: 99,
    permissions: 0b00000001,
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
// Default
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
            permissions: 0,
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
              const bit = 1 << parseInt(permKey, 10);
              return {
                ...r,
                permissions: value
                  ? r.permissions | bit
                  : r.permissions & ~bit,
              };
            }),
          );
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
        onRoleDelete={(id) => {
          setRoles((prev) => prev.filter((r) => r.id !== id));
          setSelectedId(undefined);
        }}
        onPermissionToggle={(roleId, permKey, value) => {
          setRoles((prev) =>
            prev.map((r) => {
              if (r.id !== roleId) return r;
              const bit = 1 << parseInt(permKey, 10);
              return {
                ...r,
                permissions: value
                  ? r.permissions | bit
                  : r.permissions & ~bit,
              };
            }),
          );
        }}
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
