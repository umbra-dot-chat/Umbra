import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemberList } from '@wisp-ui/react';
import type { MemberListSection } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof MemberList> = {
  title: 'React/Components/Chat/MemberList',
  component: MemberList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MemberList>;

// ---------------------------------------------------------------------------
// Inline role icons (minimal SVG for stories)
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

const defaultSections: MemberListSection[] = [
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
    id: 'owners',
    label: 'Owner',
    members: [
      { id: '1', name: 'Alice Chen', status: 'online', roleText: 'Owner', roleColor: '#e74c3c' },
    ],
  },
  {
    id: 'admins',
    label: 'Admins',
    members: [
      { id: '2', name: 'Bob Smith', status: 'online', roleText: 'Admin', roleColor: '#e67e22' },
    ],
  },
  {
    id: 'moderators',
    label: 'Moderators',
    members: [
      { id: '3', name: 'Carol White', status: 'idle', roleText: 'Moderator', roleColor: '#2ecc71' },
      { id: '4', name: 'Frank Lee', status: 'online', roleText: 'Moderator', roleColor: '#2ecc71' },
    ],
  },
  {
    id: 'members',
    label: 'Members',
    members: [
      { id: '5', name: 'Dave Johnson', status: 'online' },
      { id: '6', name: 'Eve Martinez', status: 'dnd', statusText: 'Do not disturb' },
      { id: '7', name: 'Grace Kim', status: 'offline' },
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
      { id: '4', name: 'Frank Lee', status: 'online', roleText: 'Moderator', roleColor: '#2ecc71', roleIcon: <ShieldCheckIcon size={14} color="#2ecc71" /> },
    ],
  },
  {
    id: 'members',
    label: 'Members',
    members: [
      { id: '5', name: 'Dave Johnson', status: 'online' },
      { id: '6', name: 'Eve Martinez', status: 'dnd', statusText: 'Do not disturb' },
      { id: '7', name: 'Grace Kim', status: 'offline' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ width: 260, maxHeight: 400 }}>
      <MemberList
        sections={defaultSections}
        onMemberClick={() => {}}
        onClose={() => {}}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Roles (roleColor)
// ---------------------------------------------------------------------------

export const WithRoles: Story = {
  name: 'With Roles',
  render: () => (
    <div style={{ width: 260, maxHeight: 500 }}>
      <MemberList
        sections={roleSections}
        onMemberClick={() => {}}
        onClose={() => {}}
        title="Community Members"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Role Icons (roleIcon + roleColor)
// ---------------------------------------------------------------------------

export const WithRoleIcons: Story = {
  name: 'With Role Icons',
  render: () => (
    <div style={{ width: 260, maxHeight: 500 }}>
      <MemberList
        sections={roleIconSections}
        onMemberClick={() => {}}
        onClose={() => {}}
        title="Community Members"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  render: () => (
    <div style={{ width: 260, maxHeight: 400 }}>
      <MemberList sections={[]} skeleton />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  render: () => (
    <div style={{ width: 260, maxHeight: 400 }}>
      <MemberList sections={[]} loading />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// No Close Button
// ---------------------------------------------------------------------------

export const NoCloseButton: Story = {
  name: 'No Close Button',
  render: () => (
    <div style={{ width: 260, maxHeight: 400 }}>
      <MemberList
        sections={defaultSections}
        onMemberClick={() => {}}
      />
    </div>
  ),
};
