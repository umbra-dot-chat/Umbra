/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoleCreateDialog } from './RoleCreateDialog';
import { WispProvider } from '../../providers';
import type { RolePermissionCategory } from '@coexist/wisp-core/types/RoleCreateDialog.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const testCategories: RolePermissionCategory[] = [
  {
    name: 'General',
    permissions: [
      { key: 'view_channels', label: 'View Channels', description: 'Allows viewing channels' },
      { key: 'send_messages', label: 'Send Messages' },
    ],
  },
  {
    name: 'Moderation',
    permissions: [
      { key: 'kick_members', label: 'Kick Members', dangerous: true },
      { key: 'ban_members', label: 'Ban Members', dangerous: true, description: 'Allows banning members' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderDialog(props: Record<string, unknown> = {}) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    permissionCategories: testCategories,
  };
  return render(
    <Dark>
      <RoleCreateDialog {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('RoleCreateDialog -- rendering', () => {
  it('renders when open=true', () => {
    renderDialog();
    expect(screen.getByText('Create Role')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Create Role')).not.toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderDialog({ title: 'Edit Role' });
    expect(screen.getByText('Edit Role')).toBeInTheDocument();
  });

  it('renders name input', () => {
    renderDialog();
    expect(screen.getByPlaceholderText('Enter role name')).toBeInTheDocument();
  });

  it('renders Cancel and Create buttons', () => {
    renderDialog();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Color picker
// ---------------------------------------------------------------------------

describe('RoleCreateDialog -- color picker', () => {
  it('renders the color picker label', () => {
    renderDialog();
    expect(screen.getByText('Role Color')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Permission categories
// ---------------------------------------------------------------------------

describe('RoleCreateDialog -- permission categories', () => {
  it('renders permission category names', () => {
    renderDialog();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Moderation')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

describe('RoleCreateDialog -- submit', () => {
  it('calls onSubmit with form data when Create is clicked', () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    const nameInput = screen.getByPlaceholderText('Enter role name');
    fireEvent.change(nameInput, { target: { value: 'Admin' } });

    fireEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Admin',
        color: '#99AAB5',
        hoisted: false,
        mentionable: false,
      }),
    );
  });

  it('does not call onSubmit when name is empty', () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });
    fireEvent.click(screen.getByText('Create'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('RoleCreateDialog -- error', () => {
  it('displays error message when error prop is set', () => {
    renderDialog({ error: 'Role name already taken' });
    expect(screen.getByText('Role name already taken')).toBeInTheDocument();
  });

  it('error element has role=alert', () => {
    renderDialog({ error: 'Role name already taken' });
    expect(screen.getByRole('alert')).toHaveTextContent('Role name already taken');
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('RoleCreateDialog -- close', () => {
  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
