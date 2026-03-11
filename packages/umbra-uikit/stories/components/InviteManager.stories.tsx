import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InviteManager } from '@wisp-ui/react';
import type { InviteLink } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof InviteManager> = {
  title: 'React/Components/Community/InviteManager',
  component: InviteManager,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InviteManager>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleInvites: InviteLink[] = [
  {
    id: 'inv-1',
    code: 'abc123',
    createdBy: 'Alice',
    createdAt: '2025-01-15T10:00:00Z',
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
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
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    maxUses: 10,
    uses: 3,
  },
  {
    id: 'inv-4',
    code: 'old-invite',
    createdBy: 'Dana',
    createdAt: '2024-12-01T00:00:00Z',
    expiresAt: new Date(Date.now() - 86400000).toISOString(),
    maxUses: 50,
    uses: 50,
  },
];

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ width: 420, maxHeight: 600 }}>
      <InviteManager
        invites={sampleInvites}
        onCreateInvite={(opts) => console.log('Create invite:', opts)}
        onDeleteInvite={(id) => console.log('Delete invite:', id)}
        onCopy={(code) => console.log('Copied:', code)}
        onClose={() => console.log('Close')}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Empty
// ---------------------------------------------------------------------------

export const Empty: Story = {
  render: () => (
    <div style={{ width: 420, maxHeight: 400 }}>
      <InviteManager
        invites={[]}
        onCreateInvite={(opts) => console.log('Create invite:', opts)}
        onCopy={(code) => console.log('Copied:', code)}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Creating
// ---------------------------------------------------------------------------

export const Creating: Story = {
  render: () => (
    <div style={{ width: 420, maxHeight: 400 }}>
      <InviteManager
        invites={sampleInvites.slice(0, 2)}
        onCreateInvite={(opts) => console.log('Create invite:', opts)}
        onDeleteInvite={(id) => console.log('Delete invite:', id)}
        onCopy={(code) => console.log('Copied:', code)}
        creating
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Vanity URL
// ---------------------------------------------------------------------------

export const WithVanityURL: Story = {
  name: 'With Vanity URL',
  render: () => (
    <div style={{ width: 420, maxHeight: 500 }}>
      <InviteManager
        invites={sampleInvites.slice(0, 2)}
        onCreateInvite={(opts) => console.log('Create invite:', opts)}
        onDeleteInvite={(id) => console.log('Delete invite:', id)}
        onCopy={(code) => console.log('Copied:', code)}
        vanitySlug="my-community"
        onVanityChange={(slug) => console.log('Vanity change:', slug)}
        onClose={() => console.log('Close')}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  render: () => (
    <div style={{ width: 420, maxHeight: 400 }}>
      <InviteManager invites={[]} skeleton />
    </div>
  ),
};
