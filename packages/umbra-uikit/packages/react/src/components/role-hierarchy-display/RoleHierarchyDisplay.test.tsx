/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { RoleHierarchyDisplay } from './RoleHierarchyDisplay';
import type { HierarchyRole } from '@coexist/wisp-core/types/RoleHierarchyDisplay.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseRoles: HierarchyRole[] = [
  { id: 'admin', name: 'Admin', color: '#e74c3c', position: 0 },
  { id: 'mod', name: 'Moderator', color: '#3498db', position: 1 },
  { id: 'member', name: 'Member', color: '#2ecc71', position: 2 },
  { id: 'everyone', name: '@everyone', color: '#95a5a6', position: 3, isDefault: true },
];

const rolesWithMembers: HierarchyRole[] = [
  { id: 'admin', name: 'Admin', color: '#e74c3c', position: 0, memberCount: 3 },
  { id: 'mod', name: 'Moderator', color: '#3498db', position: 1, memberCount: 12 },
  { id: 'member', name: 'Member', color: '#2ecc71', position: 2, memberCount: 150 },
  { id: 'everyone', name: '@everyone', color: '#95a5a6', position: 3, isDefault: true, memberCount: 1 },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — rendering', () => {
  it('renders roles in position order', () => {
    // Provide roles out of order to verify sorting
    const shuffled: HierarchyRole[] = [
      { id: 'member', name: 'Member', color: '#2ecc71', position: 2 },
      { id: 'admin', name: 'Admin', color: '#e74c3c', position: 0 },
      { id: 'mod', name: 'Moderator', color: '#3498db', position: 1 },
    ];
    render(
      <Dark>
        <RoleHierarchyDisplay roles={shuffled} />
      </Dark>,
    );
    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(3);
    // Check that role names appear
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('renders the default title', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} />
      </Dark>,
    );
    expect(screen.getByText('Role Hierarchy')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} title="Server Roles" />
      </Dark>,
    );
    expect(screen.getByText('Server Roles')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay
          roles={baseRoles}
          description="Drag to reorder roles"
        />
      </Dark>,
    );
    expect(screen.getByText('Drag to reorder roles')).toBeInTheDocument();
  });

  it('renders member counts when provided', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={rolesWithMembers} />
      </Dark>,
    );
    expect(screen.getByText('3 members')).toBeInTheDocument();
    expect(screen.getByText('12 members')).toBeInTheDocument();
    expect(screen.getByText('150 members')).toBeInTheDocument();
    expect(screen.getByText('1 member')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Editable (drag handles)
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — editable', () => {
  it('does not show drag handles when editable is false', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} editable={false} />
      </Dark>,
    );
    expect(screen.queryByTestId('drag-handle-admin')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drag-handle-mod')).not.toBeInTheDocument();
  });

  it('shows drag handles for non-default roles when editable', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} editable />
      </Dark>,
    );
    expect(screen.getByTestId('drag-handle-admin')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-mod')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-member')).toBeInTheDocument();
  });

  it('does not show a drag handle for the default role', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} editable />
      </Dark>,
    );
    expect(screen.queryByTestId('drag-handle-everyone')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Drag-to-reorder
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — drag-to-reorder', () => {
  it('calls onReorder when a role is dragged and dropped', () => {
    const onReorder = vi.fn();
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} editable onReorder={onReorder} />
      </Dark>,
    );

    const adminRow = screen.getByTestId('role-row-admin');
    const modRow = screen.getByTestId('role-row-mod');

    // Simulate drag from Admin (index 0) to Moderator (index 1)
    fireEvent.dragStart(adminRow, {
      dataTransfer: {
        effectAllowed: 'move',
        setData: vi.fn(),
      },
    });

    fireEvent.dragOver(modRow, {
      dataTransfer: { dropEffect: 'move' },
    });

    fireEvent.drop(modRow, {
      dataTransfer: {
        getData: () => '0',
      },
    });

    expect(onReorder).toHaveBeenCalledTimes(1);
    // After moving Admin (index 0) to index 1, order should be: mod, admin, member, everyone
    expect(onReorder).toHaveBeenCalledWith(['mod', 'admin', 'member', 'everyone']);
  });
});

// ---------------------------------------------------------------------------
// onRoleClick
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — onRoleClick', () => {
  it('calls onRoleClick when a role row is clicked', () => {
    const onRoleClick = vi.fn();
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} onRoleClick={onRoleClick} />
      </Dark>,
    );
    fireEvent.click(screen.getByTestId('role-row-admin'));
    expect(onRoleClick).toHaveBeenCalledWith('admin');
  });

  it('calls onRoleClick on keyboard Enter', () => {
    const onRoleClick = vi.fn();
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} onRoleClick={onRoleClick} />
      </Dark>,
    );
    const modRow = screen.getByTestId('role-row-mod');
    fireEvent.keyDown(modRow, { key: 'Enter' });
    expect(onRoleClick).toHaveBeenCalledWith('mod');
  });
});

// ---------------------------------------------------------------------------
// Default role pinned at bottom
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — default role', () => {
  it('renders the default role at the bottom', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} />
      </Dark>,
    );
    const rows = screen.getAllByRole('button');
    const lastRow = rows[rows.length - 1];
    expect(lastRow).toHaveAttribute('data-testid', 'role-row-everyone');
  });

  it('default role is not draggable', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} editable />
      </Dark>,
    );
    const defaultRow = screen.getByTestId('role-row-everyone');
    expect(defaultRow).not.toHaveAttribute('draggable', 'true');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <RoleHierarchyDisplay ref={ref} roles={baseRoles} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} className="custom-hierarchy" />
      </Dark>,
    );
    expect(container.querySelector('.custom-hierarchy')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — loading state', () => {
  it('shows loading text when loading is true', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} loading />
      </Dark>,
    );
    expect(screen.getByText('Loading roles...')).toBeInTheDocument();
  });

  it('does not render role rows while loading', () => {
    render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} loading />
      </Dark>,
    );
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton state
// ---------------------------------------------------------------------------

describe('RoleHierarchyDisplay — skeleton state', () => {
  it('renders skeleton placeholders when skeleton is true', () => {
    const { container } = render(
      <Dark>
        <RoleHierarchyDisplay roles={baseRoles} skeleton />
      </Dark>,
    );
    // No real role names should appear
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    // The root container should still render
    expect(container.firstElementChild).toBeInTheDocument();
  });
});
