/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChannelPermissionEditor } from './ChannelPermissionEditor';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleTargets = [
  { id: 'r1', name: 'Moderator', type: 'role' as const, color: '#3b82f6' },
  { id: 'r2', name: 'Member', type: 'role' as const },
  { id: 'm1', name: 'Alice', type: 'member' as const },
];

const samplePermissions = [
  {
    key: 'send_messages',
    label: 'Send Messages',
    description: 'Allow sending messages in this channel.',
    category: 'Text',
    value: 'allow' as const,
  },
  {
    key: 'manage_messages',
    label: 'Manage Messages',
    description: 'Allow deleting and pinning messages.',
    category: 'Text',
    value: 'inherit' as const,
    dangerous: true,
  },
  {
    key: 'connect',
    label: 'Connect',
    description: 'Allow connecting to voice.',
    category: 'Voice',
    value: 'deny' as const,
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderEditor(props: Record<string, unknown> = {}) {
  const defaultProps = {
    channelName: '#general',
    targets: sampleTargets,
    permissions: samplePermissions,
  };
  return render(
    <Dark>
      <ChannelPermissionEditor {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ChannelPermissionEditor -- rendering', () => {
  it('renders with default title', () => {
    renderEditor();
    expect(screen.getByText('Channel Permissions')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderEditor({ title: 'Edit Perms' });
    expect(screen.getByText('Edit Perms')).toBeInTheDocument();
  });

  it('renders channel name', () => {
    renderEditor();
    expect(screen.getByText('#general')).toBeInTheDocument();
  });

  it('renders target names', () => {
    renderEditor();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
    // 'Member' appears both as a target name and as a type label
    expect(screen.getAllByText('Member').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders Add button when onAddTarget provided', () => {
    renderEditor({ onAddTarget: vi.fn() });
    expect(screen.getByText('+ Add')).toBeInTheDocument();
  });

  it('shows placeholder when no target selected', () => {
    renderEditor();
    expect(
      screen.getByText('Select a role or member to edit permissions.'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Permission display
// ---------------------------------------------------------------------------

describe('ChannelPermissionEditor -- permissions', () => {
  it('renders permissions when target is selected', () => {
    renderEditor({ selectedTargetId: 'r1' });
    expect(screen.getByText('Send Messages')).toBeInTheDocument();
    expect(screen.getByText('Manage Messages')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('renders permission descriptions', () => {
    renderEditor({ selectedTargetId: 'r1' });
    expect(
      screen.getByText('Allow sending messages in this channel.'),
    ).toBeInTheDocument();
  });

  it('renders category headers', () => {
    renderEditor({ selectedTargetId: 'r1' });
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
  });

  it('renders segmented controls with Allow/Deny/Inherit', () => {
    renderEditor({ selectedTargetId: 'r1' });
    // Each permission gets 3 segments, we have 3 permissions = 9 buttons
    const allowBtns = screen.getAllByText('Allow');
    expect(allowBtns.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Target selection
// ---------------------------------------------------------------------------

describe('ChannelPermissionEditor -- target selection', () => {
  it('calls onTargetSelect when a target is clicked', () => {
    const onTargetSelect = vi.fn();
    renderEditor({ onTargetSelect });
    fireEvent.click(screen.getByText('Moderator'));
    expect(onTargetSelect).toHaveBeenCalledWith('r1');
  });
});

// ---------------------------------------------------------------------------
// Permission change
// ---------------------------------------------------------------------------

describe('ChannelPermissionEditor -- permission change', () => {
  it('calls onPermissionChange when a segment is clicked', () => {
    const onPermissionChange = vi.fn();
    renderEditor({ selectedTargetId: 'r1', onPermissionChange });
    // Click the "Deny" button for the first permission (Send Messages)
    const denyBtns = screen.getAllByText('Deny');
    fireEvent.click(denyBtns[0]);
    expect(onPermissionChange).toHaveBeenCalledWith('r1', 'send_messages', 'deny');
  });
});

// ---------------------------------------------------------------------------
// Save / Reset
// ---------------------------------------------------------------------------

describe('ChannelPermissionEditor -- save/reset', () => {
  it('renders Save button when onSave is provided', () => {
    renderEditor({ onSave: vi.fn() });
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders Reset button when onReset is provided', () => {
    renderEditor({ onReset: vi.fn() });
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('calls onSave when Save is clicked', () => {
    const onSave = vi.fn();
    renderEditor({ onSave });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when Reset is clicked', () => {
    const onReset = vi.fn();
    renderEditor({ onReset });
    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Add / Remove target
// ---------------------------------------------------------------------------

describe('ChannelPermissionEditor -- add/remove target', () => {
  it('calls onAddTarget when + Add is clicked', () => {
    const onAddTarget = vi.fn();
    renderEditor({ onAddTarget });
    fireEvent.click(screen.getByText('+ Add'));
    expect(onAddTarget).toHaveBeenCalledTimes(1);
  });

  it('calls onRemoveTarget when x is clicked', () => {
    const onRemoveTarget = vi.fn();
    renderEditor({ onRemoveTarget });
    const removeBtns = screen.getAllByLabelText(/Remove/);
    fireEvent.click(removeBtns[0]);
    expect(onRemoveTarget).toHaveBeenCalledWith('r1');
  });
});
