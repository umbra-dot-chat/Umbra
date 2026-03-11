import React from 'react';
import { MemberList } from '@wisp-ui/react';
import type { MemberListSection } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// ---------------------------------------------------------------------------
// Inline role icons (minimal SVG for demos)
// ---------------------------------------------------------------------------

function CrownIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L20.266 6.3a.5.5 0 0 1 .8.519l-2.834 13.3a1 1 0 0 1-.98.8H6.748a1 1 0 0 1-.98-.8L2.934 6.82a.5.5 0 0 1 .8-.52l3.36 2.864a1 1 0 0 0 1.516-.294z" />
    </svg>
  );
}

function ShieldIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function ShieldCheckIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleSections: MemberListSection[] = [
  {
    id: 'online',
    label: 'Online',
    members: [
      { id: '1', name: 'Alice Chen', status: 'online', roleText: 'Admin' },
      { id: '2', name: 'Bob Smith', status: 'online', statusText: 'In a meeting' },
      { id: '3', name: 'Carol White', status: 'idle', roleText: 'Moderator' },
    ],
  },
  {
    id: 'offline',
    label: 'Offline',
    members: [
      { id: '4', name: 'Dave Johnson', status: 'offline', roleText: 'Member' },
      { id: '5', name: 'Eve Martinez', status: 'offline' },
    ],
  },
];

const roleSections: MemberListSection[] = [
  {
    id: 'admins',
    label: 'Admins',
    members: [
      { id: '1', name: 'Alice Chen', status: 'online', roleText: 'Server Owner', roleColor: '#e74c3c', roleIcon: <CrownIcon size={14} color="#e74c3c" /> },
    ],
  },
  {
    id: 'moderators',
    label: 'Moderators',
    members: [
      { id: '2', name: 'Bob Smith', status: 'online', roleText: 'Moderator', roleColor: '#2ecc71', roleIcon: <ShieldCheckIcon size={14} color="#2ecc71" /> },
      { id: '3', name: 'Carol White', status: 'idle', roleText: 'Moderator', roleColor: '#2ecc71', roleIcon: <ShieldCheckIcon size={14} color="#2ecc71" /> },
    ],
  },
  {
    id: 'members',
    label: 'Members',
    members: [
      { id: '4', name: 'Dave Johnson', status: 'online' },
      { id: '5', name: 'Eve Martinez', status: 'dnd', statusText: 'Do not disturb' },
      { id: '6', name: 'Frank Lee', status: 'offline' },
    ],
  },
];

const roleIconSections: MemberListSection[] = [
  {
    id: 'owner',
    label: 'Owner',
    members: [
      { id: '1', name: 'Alice Chen', status: 'online', roleText: 'Owner', roleColor: '#e74c3c', roleIcon: <CrownIcon size={14} color="#e74c3c" /> },
    ],
  },
  {
    id: 'admins',
    label: 'Admins',
    members: [
      { id: '2', name: 'Bob Smith', status: 'online', roleText: 'Admin', roleColor: '#e67e22', roleIcon: <ShieldIcon size={14} color="#e67e22" /> },
      { id: '3', name: 'Carol White', status: 'idle', roleText: 'Admin', roleColor: '#e67e22', roleIcon: <ShieldIcon size={14} color="#e67e22" /> },
    ],
  },
  {
    id: 'moderators',
    label: 'Moderators',
    members: [
      { id: '4', name: 'Dave Johnson', status: 'online', roleText: 'Moderator', roleColor: '#2ecc71', roleIcon: <ShieldCheckIcon size={14} color="#2ecc71" /> },
    ],
  },
  {
    id: 'members',
    label: 'Members',
    members: [
      { id: '5', name: 'Eve Martinez', status: 'dnd', statusText: 'Do not disturb' },
      { id: '6', name: 'Frank Lee', status: 'offline' },
      { id: '7', name: 'Grace Kim', status: 'online' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export const memberListEntry: ComponentEntry = {
  slug: 'member-list',
  name: 'MemberList',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Side panel showing grouped user lists with online/offline status, collapsible sections, avatars, and role icons.',
  variantCount: 5,
  keywords: ['member', 'list', 'users', 'online', 'offline', 'role', 'panel', 'sidebar', 'icon'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <MemberList
        sections={[
          {
            id: 'online',
            label: 'Online',
            members: [
              { id: '1', name: 'Alice Chen', status: 'online', roleText: 'Admin', roleIcon: <ShieldIcon size={14} color="#e67e22" /> },
              { id: '2', name: 'Bob Smith', status: 'online' },
            ],
          },
          {
            id: 'offline',
            label: 'Offline',
            members: [
              { id: '3', name: 'Dave Johnson', status: 'offline' },
            ],
          },
        ]}
        style={{ width: 240, maxHeight: 280 }}
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <MemberList
          sections={sampleSections}
          onMemberClick={() => {}}
          onClose={() => {}}
          style={{ width: 260, maxHeight: 400 }}
        />
      ),
      code: `<MemberList
  sections={[
    {
      id: 'online',
      label: 'Online',
      members: [
        { id: '1', name: 'Alice Chen', status: 'online', roleText: 'Admin' },
        { id: '2', name: 'Bob Smith', status: 'online', statusText: 'In a meeting' },
        { id: '3', name: 'Carol White', status: 'idle', roleText: 'Moderator' },
      ],
    },
    {
      id: 'offline',
      label: 'Offline',
      members: [
        { id: '4', name: 'Dave Johnson', status: 'offline', roleText: 'Member' },
        { id: '5', name: 'Eve Martinez', status: 'offline' },
      ],
    },
  ]}
  onMemberClick={(member) => console.log(member)}
  onClose={() => setOpen(false)}
/>`,
    },
    {
      title: 'With Roles',
      render: (
        <MemberList
          sections={roleSections}
          onMemberClick={() => {}}
          title="Server Members"
          style={{ width: 260, maxHeight: 400 }}
        />
      ),
      code: `<MemberList
  sections={[
    { id: 'admins', label: 'Admins', members: [
      { id: '1', name: 'Alice', roleText: 'Owner', roleColor: '#e74c3c', roleIcon: <CrownIcon /> },
    ] },
    { id: 'moderators', label: 'Moderators', members: [
      { id: '2', name: 'Bob', roleText: 'Moderator', roleColor: '#2ecc71', roleIcon: <ShieldCheckIcon /> },
    ] },
    { id: 'members', label: 'Members', members: [...] },
  ]}
  title="Server Members"
/>`,
    },
    {
      title: 'With Role Icons',
      render: (
        <MemberList
          sections={roleIconSections}
          onMemberClick={() => {}}
          onClose={() => {}}
          title="Community Members"
          style={{ width: 260, maxHeight: 500 }}
        />
      ),
      code: `<MemberList
  sections={[
    { id: 'owner', label: 'Owner', members: [
      { id: '1', name: 'Alice', roleText: 'Owner', roleColor: '#e74c3c',
        roleIcon: <CrownIcon size={14} color="#e74c3c" /> },
    ] },
    { id: 'admins', label: 'Admins', members: [
      { id: '2', name: 'Bob', roleText: 'Admin', roleColor: '#e67e22',
        roleIcon: <ShieldIcon size={14} color="#e67e22" /> },
    ] },
    { id: 'moderators', label: 'Moderators', members: [
      { id: '4', name: 'Dave', roleText: 'Moderator', roleColor: '#2ecc71',
        roleIcon: <ShieldCheckIcon size={14} color="#2ecc71" /> },
    ] },
    { id: 'members', label: 'Members', members: [...] },
  ]}
  title="Community Members"
/>`,
    },
    {
      title: 'Loading',
      render: (
        <MemberList
          sections={[]}
          loading
          style={{ width: 260, maxHeight: 300 }}
        />
      ),
      code: `<MemberList sections={[]} loading />`,
    },
    {
      title: 'Skeleton',
      render: (
        <MemberList
          sections={[]}
          skeleton
          style={{ width: 260, maxHeight: 300 }}
        />
      ),
      code: `<MemberList sections={[]} skeleton />`,
    },
  ],

  props: [
    { name: 'sections', type: 'MemberListSection[]', required: true, description: 'Grouped sections of members.' },
    { name: 'onMemberClick', type: '(member: MemberListMember) => void', description: 'Called when a member item is clicked.' },
    { name: 'title', type: 'string', default: "'Members'", description: 'Panel title.' },
    { name: 'onClose', type: '() => void', description: 'Called when the close button is clicked. If omitted, no close button.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Whether the panel is in a loading state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
