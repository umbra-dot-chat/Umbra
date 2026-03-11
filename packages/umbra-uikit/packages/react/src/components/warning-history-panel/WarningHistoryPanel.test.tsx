/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WarningHistoryPanel } from './WarningHistoryPanel';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleWarnings = [
  {
    id: 'w1',
    reason: 'Spam messages in general',
    issuedBy: 'Admin',
    issuedAt: '2025-01-01',
    expiresAt: '2025-06-01',
    active: true,
  },
  {
    id: 'w2',
    reason: 'Inappropriate language',
    issuedBy: 'Moderator',
    issuedAt: '2024-12-15',
    active: false,
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderPanel(props: Record<string, unknown> = {}) {
  const defaultProps = {
    memberName: 'TestUser',
    warnings: sampleWarnings,
  };
  return render(
    <Dark>
      <WarningHistoryPanel {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('WarningHistoryPanel -- rendering', () => {
  it('renders the panel title', () => {
    renderPanel();
    expect(screen.getByText('Warning History')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderPanel({ title: 'Warnings' });
    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('renders member name', () => {
    renderPanel();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('renders warning count badge', () => {
    renderPanel();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders warning reasons', () => {
    renderPanel();
    expect(screen.getByText('Spam messages in general')).toBeInTheDocument();
    expect(screen.getByText('Inappropriate language')).toBeInTheDocument();
  });

  it('renders Active and Expired badges', () => {
    renderPanel();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('WarningHistoryPanel -- empty state', () => {
  it('shows empty message when no warnings', () => {
    renderPanel({ warnings: [] });
    expect(screen.getByText('No warnings on record.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

describe('WarningHistoryPanel -- delete', () => {
  it('calls onDeleteWarning with warning id when delete is clicked', () => {
    const onDeleteWarning = vi.fn();
    renderPanel({ onDeleteWarning });
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteWarning).toHaveBeenCalledWith('w1');
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('WarningHistoryPanel -- close', () => {
  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderPanel({ onClose });
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
