/**
 * RoleHierarchyDisplay — Stories showing role hierarchy patterns.
 *
 * @module stories/role-hierarchy-display
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RoleHierarchyDisplay } from './RoleHierarchyDisplay';

const meta: Meta<typeof RoleHierarchyDisplay> = {
  title: 'Components/Community/RoleHierarchyDisplay',
  component: RoleHierarchyDisplay,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RoleHierarchyDisplay>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    roles: [
      { id: 'owner', name: 'Owner', color: '#f39c12', position: 0 },
      { id: 'admin', name: 'Admin', color: '#e74c3c', position: 1 },
      { id: 'mod', name: 'Moderator', color: '#3498db', position: 2 },
      { id: 'member', name: 'Member', color: '#2ecc71', position: 3 },
      { id: 'everyone', name: '@everyone', color: '#95a5a6', position: 4, isDefault: true },
    ],
  },
};

// ---------------------------------------------------------------------------
// Editable
// ---------------------------------------------------------------------------

export const Editable: Story = {
  args: {
    roles: [
      { id: 'owner', name: 'Owner', color: '#f39c12', position: 0 },
      { id: 'admin', name: 'Admin', color: '#e74c3c', position: 1 },
      { id: 'mod', name: 'Moderator', color: '#3498db', position: 2 },
      { id: 'helper', name: 'Helper', color: '#9b59b6', position: 3 },
      { id: 'member', name: 'Member', color: '#2ecc71', position: 4 },
      { id: 'everyone', name: '@everyone', color: '#95a5a6', position: 5, isDefault: true },
    ],
    editable: true,
    description: 'Drag roles to reorder. The @everyone role cannot be moved.',
    onReorder: (ids) => {
      console.log('New role order:', ids);
    },
  },
};

// ---------------------------------------------------------------------------
// WithMemberCounts
// ---------------------------------------------------------------------------

export const WithMemberCounts: Story = {
  name: 'With Member Counts',
  args: {
    roles: [
      { id: 'owner', name: 'Owner', color: '#f39c12', position: 0, memberCount: 1 },
      { id: 'admin', name: 'Admin', color: '#e74c3c', position: 1, memberCount: 5 },
      { id: 'mod', name: 'Moderator', color: '#3498db', position: 2, memberCount: 12 },
      { id: 'vip', name: 'VIP', color: '#e67e22', position: 3, memberCount: 42 },
      { id: 'member', name: 'Member', color: '#2ecc71', position: 4, memberCount: 328 },
      { id: 'everyone', name: '@everyone', color: '#95a5a6', position: 5, isDefault: true, memberCount: 500 },
    ],
    editable: true,
    description: 'Roles with member counts displayed.',
    onRoleClick: (id) => {
      console.log('Clicked role:', id);
    },
  },
};
