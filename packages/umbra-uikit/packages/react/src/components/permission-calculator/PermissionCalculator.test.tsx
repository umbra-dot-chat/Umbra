/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PermissionCalculator } from './PermissionCalculator';
import { WispProvider } from '../../providers';
import type { ComputedPermission } from '@coexist/wisp-core/types/PermissionCalculator.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const testPermissions: ComputedPermission[] = [
  {
    key: 'view_channels',
    label: 'View Channels',
    category: 'General',
    granted: true,
    source: 'role',
    sourceName: 'Member',
  },
  {
    key: 'send_messages',
    label: 'Send Messages',
    category: 'General',
    granted: true,
    source: 'role',
    sourceName: 'Member',
  },
  {
    key: 'kick_members',
    label: 'Kick Members',
    category: 'Moderation',
    granted: false,
    source: 'role',
    sourceName: 'Member',
  },
  {
    key: 'ban_members',
    label: 'Ban Members',
    category: 'Moderation',
    granted: true,
    source: 'administrator',
  },
  {
    key: 'manage_channels',
    label: 'Manage Channels',
    category: 'Administration',
    granted: true,
    source: 'owner',
  },
  {
    key: 'manage_roles',
    label: 'Manage Roles',
    category: 'Administration',
    granted: false,
    source: 'channel-override',
    sourceName: '#general override',
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderCalculator(props: Record<string, unknown> = {}) {
  const defaultProps = {
    userName: 'Alice',
    channelName: '#general',
    permissions: testPermissions,
  };
  return render(
    <Dark>
      <PermissionCalculator {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('PermissionCalculator -- rendering', () => {
  it('renders user name and channel name', () => {
    renderCalculator();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('#general')).toBeInTheDocument();
  });

  it('renders default title', () => {
    renderCalculator();
    expect(screen.getByText('Effective Permissions')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderCalculator({ title: 'Permissions for Alice' });
    expect(screen.getByText('Permissions for Alice')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Permission display
// ---------------------------------------------------------------------------

describe('PermissionCalculator -- permission display', () => {
  it('renders granted permission labels', () => {
    renderCalculator();
    expect(screen.getByText('View Channels')).toBeInTheDocument();
    expect(screen.getByText('Send Messages')).toBeInTheDocument();
  });

  it('renders denied permission labels', () => {
    renderCalculator();
    expect(screen.getByText('Kick Members')).toBeInTheDocument();
    expect(screen.getByText('Manage Roles')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Category grouping
// ---------------------------------------------------------------------------

describe('PermissionCalculator -- category grouping', () => {
  it('renders category names', () => {
    renderCalculator();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Moderation')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Source display
// ---------------------------------------------------------------------------

describe('PermissionCalculator -- source display', () => {
  it('shows role source name', () => {
    renderCalculator();
    // "Member" appears as source badge for role-sourced permissions
    const memberBadges = screen.getAllByText('Member');
    expect(memberBadges.length).toBeGreaterThan(0);
  });

  it('shows Administrator source', () => {
    renderCalculator();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('shows Owner source', () => {
    renderCalculator();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('shows channel override source', () => {
    renderCalculator();
    expect(screen.getByText('#general override')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('PermissionCalculator -- loading', () => {
  it('shows loading text when loading=true', () => {
    renderCalculator({ loading: true });
    expect(screen.getByText('Calculating permissions...')).toBeInTheDocument();
  });
});
