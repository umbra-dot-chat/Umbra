import React from 'react';
import { RoleManagementPanel } from '@wisp-ui/react';
import type { ManagedRole, RolePermissionCategory } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleRoles: ManagedRole[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    color: '#e74c3c',
    position: 1,
    permissions: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true },
    memberCount: 3,
    hoisted: true,
    mentionable: true,
  },
  {
    id: 'role-mod',
    name: 'Moderator',
    color: '#2ecc71',
    position: 2,
    permissions: { '0': true, '1': false, '2': false, '3': true, '4': true, '5': true },
    memberCount: 7,
    hoisted: true,
    mentionable: true,
  },
  {
    id: 'role-member',
    name: 'Member',
    color: '#3498db',
    position: 3,
    permissions: { '0': true, '3': true, '4': true },
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
      { key: '0', label: 'View Channels', description: 'View text and voice channels' },
      { key: '1', label: 'Manage Channels', description: 'Create, edit, and delete channels', dangerous: true },
      { key: '2', label: 'Manage Roles', description: 'Create and manage roles', dangerous: true },
    ],
  },
  {
    name: 'Text',
    permissions: [
      { key: '3', label: 'Send Messages', description: 'Send messages in text channels' },
      { key: '4', label: 'Embed Links', description: 'Show URL previews' },
      { key: '5', label: 'Manage Messages', description: 'Delete and pin others\' messages', dangerous: true },
    ],
  },
  {
    name: 'Voice',
    permissions: [
      { key: '6', label: 'Connect', description: 'Join voice channels' },
      { key: '7', label: 'Speak', description: 'Speak in voice channels' },
    ],
  },
];

const cardRoles: ManagedRole[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    color: '#e74c3c',
    position: 1,
    permissions: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true },
    memberCount: 3,
    hoisted: true,
    mentionable: true,
  },
  {
    id: 'role-mod',
    name: 'Moderator',
    color: '#2ecc71',
    position: 2,
    permissions: { '0': true, '3': true, '4': true, '5': true },
    memberCount: 7,
    hoisted: true,
    mentionable: true,
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

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export const roleManagementPanelEntry: ComponentEntry = {
  slug: 'role-management-panel',
  name: 'RoleManagementPanel',
  category: 'components',
  subcategory: 'Community',
  description:
    'Admin panel for creating, editing, and managing community roles with drag-to-reorder, color picker, and tri-state permission toggles (Allow / Inherit / Deny).',
  variantCount: 5,
  keywords: ['role', 'permission', 'admin', 'manage', 'hierarchy', 'drag', 'reorder', 'community', 'color'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <RoleManagementPanel
        roles={cardRoles}
        permissionCategories={sampleCategories}
        selectedRoleId="role-admin"
        style={{ width: '100%', maxWidth: 480, maxHeight: 280 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <RoleManagementPanel
          roles={sampleRoles}
          permissionCategories={sampleCategories}
          selectedRoleId="role-admin"
          onRoleSelect={() => {}}
          onRoleUpdate={() => {}}
          onRoleCreate={() => {}}
          onRoleDelete={() => {}}
          onPermissionToggle={() => {}}
          onRoleReorder={() => {}}
          style={{ width: '100%', maxWidth: 900, height: 600 }}
        />
      ),
      code: `<RoleManagementPanel
  roles={roles}
  permissionCategories={categories}
  selectedRoleId={selectedId}
  onRoleSelect={(id) => setSelected(id)}
  onRoleUpdate={(id, updates) => updateRole(id, updates)}
  onRoleCreate={() => createRole()}
  onRoleDelete={(id) => deleteRole(id)}
  onPermissionToggle={(id, key, val) => togglePerm(id, key, val)}
  onRoleReorder={(id, pos) => reorder(id, pos)}
/>`,
    },
    {
      title: 'Read Only',
      render: (
        <RoleManagementPanel
          roles={sampleRoles}
          permissionCategories={sampleCategories}
          selectedRoleId="role-mod"
          style={{ width: '100%', maxWidth: 900, height: 500 }}
        />
      ),
      code: `<RoleManagementPanel
  roles={roles}
  permissionCategories={categories}
  selectedRoleId="role-mod"
/>`,
    },
    {
      title: 'Empty (No Selection)',
      render: (
        <RoleManagementPanel
          roles={sampleRoles}
          permissionCategories={sampleCategories}
          onRoleCreate={() => {}}
          style={{ width: '100%', maxWidth: 900, height: 400 }}
        />
      ),
      code: `<RoleManagementPanel
  roles={roles}
  permissionCategories={categories}
  onRoleCreate={() => createRole()}
/>`,
    },
    {
      title: 'Loading',
      render: (
        <RoleManagementPanel
          roles={[]}
          permissionCategories={sampleCategories}
          loading
          style={{ width: '100%', maxWidth: 900, height: 300 }}
        />
      ),
      code: `<RoleManagementPanel roles={[]} permissionCategories={[]} loading />`,
    },
    {
      title: 'Skeleton',
      render: (
        <RoleManagementPanel
          roles={[]}
          permissionCategories={sampleCategories}
          skeleton
          style={{ width: '100%', maxWidth: 900, height: 300 }}
        />
      ),
      code: `<RoleManagementPanel roles={[]} permissionCategories={[]} skeleton />`,
    },
  ],

  props: [
    { name: 'roles', type: 'ManagedRole[]', required: true, description: 'List of roles to manage.' },
    { name: 'permissionCategories', type: 'RolePermissionCategory[]', required: true, description: 'Permission categories for the grid.' },
    { name: 'selectedRoleId', type: 'string', description: 'Currently selected role ID.' },
    { name: 'onRoleSelect', type: '(roleId: string) => void', description: 'Called when a role is selected.' },
    { name: 'onRoleUpdate', type: '(roleId: string, updates: Partial<ManagedRole>) => void', description: 'Called when a role is updated.' },
    { name: 'onRoleCreate', type: '() => void', description: 'Called when a new role should be created.' },
    { name: 'onRoleDelete', type: '(roleId: string) => void', description: 'Called when a role should be deleted.' },
    { name: 'onPermissionToggle', type: '(roleId: string, key: string, value: boolean | null) => void', description: 'Called when a permission is toggled. true=allow, null=inherit, false=deny.' },
    { name: 'onRoleReorder', type: '(roleId: string, newPosition: number) => void', description: 'Called when roles are reordered via drag-and-drop.' },
    { name: 'colorPresets', type: 'string[]', description: 'Preset colors for the role color picker. Default palette used if omitted.' },
    { name: 'title', type: 'string', default: "'Roles'", description: 'Panel title.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Loading state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton state.' },
  ],
};
