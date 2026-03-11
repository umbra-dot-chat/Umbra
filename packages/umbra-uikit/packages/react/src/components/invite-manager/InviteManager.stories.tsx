/**
 * InviteManager -- Stories for managing community invite links.
 *
 * @module stories/invite-manager
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InviteManager } from './InviteManager';
import type { InviteLink } from '@coexist/wisp-core/types/InviteManager.types';

const meta: Meta<typeof InviteManager> = {
  title: 'Components/Community/InviteManager',
  component: InviteManager,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InviteManager>;

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleInvites: InviteLink[] = [
  {
    id: 'inv-1',
    code: 'abc123',
    createdBy: 'Alice',
    createdAt: '2025-01-15T10:00:00Z',
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), // +7 days
    maxUses: 25,
    uses: 8,
  },
  {
    id: 'inv-2',
    code: 'welcome2025',
    createdBy: 'Bob',
    createdAt: '2025-01-10T14:30:00Z',
    expiresAt: null,
    maxUses: null,
    uses: 142,
    isVanity: true,
  },
  {
    id: 'inv-3',
    code: 'temp-link',
    createdBy: 'Charlie',
    createdAt: '2025-01-20T08:00:00Z',
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // +1 hour
    maxUses: 10,
    uses: 3,
  },
  {
    id: 'inv-4',
    code: 'old-invite',
    createdBy: 'Dana',
    createdAt: '2024-12-01T00:00:00Z',
    expiresAt: new Date(Date.now() - 86400000).toISOString(), // expired
    maxUses: 50,
    uses: 50,
  },
];

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    invites: sampleInvites,
    onCreateInvite: (opts) => console.log('Create invite:', opts),
    onDeleteInvite: (id) => console.log('Delete invite:', id),
    onCopy: (code) => console.log('Copied:', code),
    onClose: () => console.log('Close'),
  },
};

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  args: {
    invites: [],
    onCreateInvite: (opts) => console.log('Create invite:', opts),
    onCopy: (code) => console.log('Copied:', code),
  },
};

// ---------------------------------------------------------------------------
// Creating
// ---------------------------------------------------------------------------

export const Creating: Story = {
  args: {
    invites: sampleInvites.slice(0, 2),
    onCreateInvite: (opts) => console.log('Create invite:', opts),
    onDeleteInvite: (id) => console.log('Delete invite:', id),
    onCopy: (code) => console.log('Copied:', code),
    creating: true,
  },
};

// ---------------------------------------------------------------------------
// With Vanity URL
// ---------------------------------------------------------------------------

export const WithVanityURL: Story = {
  name: 'With Vanity URL',
  args: {
    invites: sampleInvites.slice(0, 2),
    onCreateInvite: (opts) => console.log('Create invite:', opts),
    onDeleteInvite: (id) => console.log('Delete invite:', id),
    onCopy: (code) => console.log('Copied:', code),
    vanitySlug: 'my-community',
    onVanityChange: (slug) => console.log('Vanity change:', slug),
    onClose: () => console.log('Close'),
  },
};
