import React from 'react';
import { InviteManager } from '@wisp-ui/react';
import type { InviteLink } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

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

const cardInvites: InviteLink[] = [
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
];

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export const inviteManagerEntry: ComponentEntry = {
  slug: 'invite-manager',
  name: 'InviteManager',
  category: 'components',
  subcategory: 'Community',
  description:
    'Panel for creating and managing community invite links with expiry, max uses, copy-to-clipboard, and vanity URL support.',
  variantCount: 4,
  keywords: ['invite', 'link', 'share', 'community', 'manage', 'vanity', 'url', 'copy', 'expiry'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <InviteManager
        invites={cardInvites}
        style={{ width: 340, maxHeight: 280 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <InviteManager
          invites={sampleInvites}
          onCreateInvite={() => {}}
          onDeleteInvite={() => {}}
          onCopy={() => {}}
          onClose={() => {}}
          style={{ width: 420, maxHeight: 600 }}
        />
      ),
      code: `<InviteManager
  invites={activeInvites}
  onCreateInvite={(opts) => createInvite(opts)}
  onDeleteInvite={(id) => deleteInvite(id)}
  onCopy={(code) => navigator.clipboard.writeText(code)}
  onClose={() => setOpen(false)}
/>`,
    },
    {
      title: 'Empty',
      render: (
        <InviteManager
          invites={[]}
          onCreateInvite={() => {}}
          onCopy={() => {}}
          style={{ width: 420, maxHeight: 300 }}
        />
      ),
      code: `<InviteManager
  invites={[]}
  onCreateInvite={(opts) => createInvite(opts)}
  onCopy={(code) => navigator.clipboard.writeText(code)}
/>`,
    },
    {
      title: 'With Vanity URL',
      render: (
        <InviteManager
          invites={sampleInvites.slice(0, 2)}
          onCreateInvite={() => {}}
          onDeleteInvite={() => {}}
          onCopy={() => {}}
          vanitySlug="my-community"
          onVanityChange={() => {}}
          onClose={() => {}}
          style={{ width: 420, maxHeight: 500 }}
        />
      ),
      code: `<InviteManager
  invites={invites}
  onCreateInvite={(opts) => createInvite(opts)}
  onDeleteInvite={(id) => deleteInvite(id)}
  onCopy={(code) => navigator.clipboard.writeText(code)}
  vanitySlug="my-community"
  onVanityChange={(slug) => setVanitySlug(slug)}
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <InviteManager
          invites={[]}
          skeleton
          style={{ width: 420, maxHeight: 300 }}
        />
      ),
      code: `<InviteManager invites={[]} skeleton />`,
    },
  ],

  props: [
    { name: 'invites', type: 'InviteLink[]', required: true, description: 'List of active invite links.' },
    { name: 'onCreateInvite', type: '(options: InviteCreateOptions) => void', description: 'Called when a new invite is created.' },
    { name: 'onDeleteInvite', type: '(inviteId: string) => void', description: 'Called when an invite is deleted/revoked.' },
    { name: 'onCopy', type: '(code: string) => void', description: 'Called when an invite code is copied.' },
    { name: 'baseUrl', type: 'string', default: "'https://umbra.app/invite/'", description: 'Base URL for constructing full invite links.' },
    { name: 'creating', type: 'boolean', default: 'false', description: 'Whether creation is in progress.' },
    { name: 'title', type: 'string', default: "'Invite People'", description: 'Title text.' },
    { name: 'vanitySlug', type: 'string', description: 'Vanity URL slug (if set).' },
    { name: 'onVanityChange', type: '(slug: string) => void', description: 'Called when vanity URL is changed.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
    { name: 'onClose', type: '() => void', description: 'Called when close/back is clicked.' },
  ],
};
