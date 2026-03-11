/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { RoleManagementPanel } from './RoleManagementPanel';
import type {
  ManagedRole,
  RolePermissionCategory,
} from '@coexist/wisp-core/types/RoleManagementPanel.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseRoles: ManagedRole[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    color: '#e74c3c',
    position: 1,
    permissions: { '0': true, '1': true, '2': true },
    memberCount: 3,
    hoisted: true,
    mentionable: true,
    isDefault: false,
  },
  {
    id: 'role-mod',
    name: 'Moderator',
    color: '#3498db',
    position: 2,
    permissions: { '0': true, '1': true },
    memberCount: 7,
    hoisted: false,
    mentionable: false,
    isDefault: false,
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

const baseCategories: RolePermissionCategory[] = [
  {
    name: 'General',
    permissions: [
      { key: '0', label: 'View Channels', description: 'Allows viewing channels' },
      { key: '1', label: 'Manage Channels', description: 'Allows managing channels', dangerous: true },
    ],
  },
  {
    name: 'Text',
    permissions: [
      { key: '2', label: 'Send Messages', description: 'Allows sending messages' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- rendering', () => {
  it('renders the role list', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
        />
      </Dark>,
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
    expect(screen.getByText('@everyone')).toBeInTheDocument();
  });

  it('renders default title', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
        />
      </Dark>,
    );
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          title="Server Roles"
        />
      </Dark>,
    );
    expect(screen.getByText('Server Roles')).toBeInTheDocument();
  });

  it('renders member counts for roles', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
        />
      </Dark>,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('shows empty state when no role is selected', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
        />
      </Dark>,
    );
    expect(screen.getByText('Select a role to edit')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Role selection
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- role selection', () => {
  it('calls onRoleSelect when a role is clicked', () => {
    const onRoleSelect = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          onRoleSelect={onRoleSelect}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Admin'));
    expect(onRoleSelect).toHaveBeenCalledWith('role-admin');
  });

  it('shows permission grid when a role is selected', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
        />
      </Dark>,
    );
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('View Channels')).toBeInTheDocument();
    expect(screen.getByText('Send Messages')).toBeInTheDocument();
  });

  it('shows role name input when a role is selected', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
        />
      </Dark>,
    );
    const nameInput = screen.getByLabelText('Role name') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe('Admin');
  });
});

// ---------------------------------------------------------------------------
// Role updates
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- role updates', () => {
  it('calls onRoleUpdate when the name input changes', () => {
    const onRoleUpdate = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
          onRoleUpdate={onRoleUpdate}
        />
      </Dark>,
    );
    const nameInput = screen.getByLabelText('Role name');
    fireEvent.change(nameInput, { target: { value: 'Super Admin' } });
    expect(onRoleUpdate).toHaveBeenCalledWith('role-admin', { name: 'Super Admin' });
  });

  it('calls onRoleUpdate when hoisted toggle is clicked', () => {
    const onRoleUpdate = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
          onRoleUpdate={onRoleUpdate}
        />
      </Dark>,
    );
    const hoistedToggle = screen.getByLabelText('Display role separately');
    fireEvent.click(hoistedToggle);
    // Admin has hoisted=true, so toggling should set it to false
    expect(onRoleUpdate).toHaveBeenCalledWith('role-admin', { hoisted: false });
  });

  it('calls onRoleUpdate when mentionable toggle is clicked', () => {
    const onRoleUpdate = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-mod"
          onRoleUpdate={onRoleUpdate}
        />
      </Dark>,
    );
    const mentionableToggle = screen.getByLabelText('Allow mentioning');
    fireEvent.click(mentionableToggle);
    // Mod has mentionable=false, so toggling should set it to true
    expect(onRoleUpdate).toHaveBeenCalledWith('role-mod', { mentionable: true });
  });
});

// ---------------------------------------------------------------------------
// Role creation
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- role creation', () => {
  it('calls onRoleCreate when the create button is clicked', () => {
    const onRoleCreate = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          onRoleCreate={onRoleCreate}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Create role'));
    expect(onRoleCreate).toHaveBeenCalledTimes(1);
  });

  it('does not render create button when onRoleCreate is not provided', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
        />
      </Dark>,
    );
    expect(screen.queryByLabelText('Create role')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Role deletion
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- role deletion', () => {
  it('calls onRoleDelete when the delete button is clicked', () => {
    const onRoleDelete = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
          onRoleDelete={onRoleDelete}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Delete Admin role'));
    expect(onRoleDelete).toHaveBeenCalledWith('role-admin');
  });

  it('does not show delete button for default role', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-everyone"
          onRoleDelete={vi.fn()}
        />
      </Dark>,
    );
    expect(screen.queryByText('Delete Role')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Permission grid
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- permission grid', () => {
  it('shows permission categories with labels', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
        />
      </Dark>,
    );
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('shows permission descriptions', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
        />
      </Dark>,
    );
    expect(screen.getByText('Allows viewing channels')).toBeInTheDocument();
    expect(screen.getByText('Allows sending messages')).toBeInTheDocument();
  });

  it('calls onPermissionToggle with true when Allow is clicked', () => {
    const onPermissionToggle = vi.fn();
    // Use mod role where key '2' is absent (inherit)
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-mod"
          onPermissionToggle={onPermissionToggle}
        />
      </Dark>,
    );
    // Find the Allow button in the "Send Messages" permission (key '2', currently inherit)
    const radioGroup = screen.getByLabelText('Send Messages permission');
    const allowBtn = radioGroup.querySelector('[aria-label="Allow"]') as HTMLElement;
    fireEvent.click(allowBtn);
    expect(onPermissionToggle).toHaveBeenCalledWith('role-mod', '2', true);
  });

  it('calls onPermissionToggle with null when Inherit is clicked', () => {
    const onPermissionToggle = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
          onPermissionToggle={onPermissionToggle}
        />
      </Dark>,
    );
    // Find the Inherit button in the "View Channels" permission (key '0', currently allowed)
    const radioGroup = screen.getByLabelText('View Channels permission');
    const inheritBtn = radioGroup.querySelector('[aria-label="Inherit"]') as HTMLElement;
    fireEvent.click(inheritBtn);
    expect(onPermissionToggle).toHaveBeenCalledWith('role-admin', '0', null);
  });

  it('calls onPermissionToggle with false when Deny is clicked', () => {
    const onPermissionToggle = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
          onPermissionToggle={onPermissionToggle}
        />
      </Dark>,
    );
    // Find the Deny button in the "View Channels" permission (key '0', currently allowed)
    const radioGroup = screen.getByLabelText('View Channels permission');
    const denyBtn = radioGroup.querySelector('[aria-label="Deny"]') as HTMLElement;
    fireEvent.click(denyBtn);
    expect(onPermissionToggle).toHaveBeenCalledWith('role-admin', '0', false);
  });

  it('shows correct aria-pressed states for permission toggles', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
        />
      </Dark>,
    );
    // View Channels (key '0') is true (allowed)
    const viewGroup = screen.getByLabelText('View Channels permission');
    const viewAllow = viewGroup.querySelector('[aria-label="Allow"]') as HTMLElement;
    const viewInherit = viewGroup.querySelector('[aria-label="Inherit"]') as HTMLElement;
    const viewDeny = viewGroup.querySelector('[aria-label="Deny"]') as HTMLElement;
    expect(viewAllow).toHaveAttribute('aria-pressed', 'true');
    expect(viewInherit).toHaveAttribute('aria-pressed', 'false');
    expect(viewDeny).toHaveAttribute('aria-pressed', 'false');
  });

  it('can collapse and expand permission categories', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
        />
      </Dark>,
    );
    // Initially expanded
    expect(screen.getByText('View Channels')).toBeInTheDocument();

    // Collapse the General category
    fireEvent.click(screen.getByLabelText('General permissions'));
    expect(screen.queryByText('View Channels')).not.toBeInTheDocument();

    // Re-expand
    fireEvent.click(screen.getByLabelText('General permissions'));
    expect(screen.getByText('View Channels')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Color picker
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- color picker', () => {
  it('renders color preset swatches when a role is selected', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
        />
      </Dark>,
    );
    // The admin role color is #e74c3c, so that swatch should be pressed
    const selectedSwatch = screen.getByLabelText('Set color #e74c3c');
    expect(selectedSwatch).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onRoleUpdate with new color when a preset is clicked', () => {
    const onRoleUpdate = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
          onRoleUpdate={onRoleUpdate}
        />
      </Dark>,
    );
    // Click a different color preset
    const blueSwatch = screen.getByLabelText('Set color #2196f3');
    fireEvent.click(blueSwatch);
    expect(onRoleUpdate).toHaveBeenCalledWith('role-admin', { color: '#2196f3' });
  });

  it('renders custom color presets when provided', () => {
    const customPresets = ['#ff0000', '#00ff00', '#0000ff'];
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
          colorPresets={customPresets}
        />
      </Dark>,
    );
    expect(screen.getByLabelText('Set color #ff0000')).toBeInTheDocument();
    expect(screen.getByLabelText('Set color #00ff00')).toBeInTheDocument();
    expect(screen.getByLabelText('Set color #0000ff')).toBeInTheDocument();
    // Default presets should NOT be shown
    expect(screen.queryByLabelText('Set color #2196f3')).not.toBeInTheDocument();
  });

  it('displays current color hex value', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          selectedRoleId="role-admin"
        />
      </Dark>,
    );
    expect(screen.getByText('#e74c3c')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Drag-to-reorder
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- drag-to-reorder', () => {
  it('makes non-default roles draggable when onRoleReorder is provided', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          onRoleReorder={vi.fn()}
        />
      </Dark>,
    );
    // Admin and Moderator should be draggable (non-default)
    const adminItem = screen.getByLabelText('Admin role');
    const modItem = screen.getByLabelText('Moderator role');
    const everyoneItem = screen.getByLabelText('@everyone role');

    expect(adminItem).toHaveAttribute('draggable', 'true');
    expect(modItem).toHaveAttribute('draggable', 'true');
    // @everyone (isDefault) should NOT be draggable
    expect(everyoneItem).not.toHaveAttribute('draggable', 'true');
  });

  it('does not make roles draggable when onRoleReorder is not provided', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
        />
      </Dark>,
    );
    const adminItem = screen.getByLabelText('Admin role');
    expect(adminItem).not.toHaveAttribute('draggable', 'true');
  });

  it('calls onRoleReorder on drop', () => {
    const onRoleReorder = vi.fn();
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          onRoleReorder={onRoleReorder}
        />
      </Dark>,
    );
    const adminItem = screen.getByLabelText('Admin role');
    const modItem = screen.getByLabelText('Moderator role');

    // Simulate drag from Admin to Moderator position
    fireEvent.dragStart(adminItem, {
      dataTransfer: { effectAllowed: 'move', setData: vi.fn() },
    });
    fireEvent.dragEnter(modItem);
    fireEvent.dragOver(modItem, {
      dataTransfer: { dropEffect: 'move' },
    });
    fireEvent.drop(modItem, {
      dataTransfer: { dropEffect: 'move' },
    });

    expect(onRoleReorder).toHaveBeenCalledWith('role-admin', 2);
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- loading state', () => {
  it('shows loading text when loading is true', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          loading
        />
      </Dark>,
    );
    expect(screen.getByText('Loading roles...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton state
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- skeleton state', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          skeleton
        />
      </Dark>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBeTruthy();
  });

  it('does not render role names in skeleton state', () => {
    render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          skeleton
        />
      </Dark>,
    );
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <RoleManagementPanel
          ref={ref}
          roles={baseRoles}
          permissionCategories={baseCategories}
        />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('RoleManagementPanel -- className', () => {
  it('passes className to the root element', () => {
    const { container } = render(
      <Dark>
        <RoleManagementPanel
          roles={baseRoles}
          permissionCategories={baseCategories}
          className="custom-panel"
        />
      </Dark>,
    );
    expect(container.querySelector('.custom-panel')).toBeInTheDocument();
  });
});
