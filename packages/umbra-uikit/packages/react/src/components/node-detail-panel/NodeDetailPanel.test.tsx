/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NodeDetailPanel } from './NodeDetailPanel';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
  name: 'Test Node',
  nodeType: 'local' as const,
  enabled: true,
  lastSeenAt: '2025-01-15T12:00:00Z',
  maxStorageBytes: 10737418240,
  usedStorageBytes: 5368709120,
  maxBandwidthMbps: 100,
  publicKey: 'pk_test_abc123def456',
  status: 'online' as const,
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('NodeDetailPanel -- rendering', () => {
  it('renders node name', () => {
    render(<Dark><NodeDetailPanel {...defaultProps} /></Dark>);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('renders node type badge', () => {
    render(<Dark><NodeDetailPanel {...defaultProps} /></Dark>);
    expect(screen.getByText('local')).toBeInTheDocument();
  });

  it('renders status text', () => {
    render(<Dark><NodeDetailPanel {...defaultProps} /></Dark>);
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('renders public key', () => {
    render(<Dark><NodeDetailPanel {...defaultProps} /></Dark>);
    expect(screen.getByText('pk_test_abc123def456')).toBeInTheDocument();
  });

  it('renders copy button for public key', () => {
    render(<Dark><NodeDetailPanel {...defaultProps} /></Dark>);
    expect(screen.getByLabelText('Copy public key')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('NodeDetailPanel -- skeleton', () => {
  it('renders skeleton placeholder', () => {
    const { container } = render(
      <Dark><NodeDetailPanel {...defaultProps} skeleton /></Dark>,
    );
    const el = container.querySelector('[aria-hidden]');
    expect(el).toBeTruthy();
  });

  it('does not render content when skeleton', () => {
    render(<Dark><NodeDetailPanel {...defaultProps} skeleton /></Dark>);
    expect(screen.queryByText('Test Node')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('NodeDetailPanel -- interactions', () => {
  it('calls onToggleEnabled when toggle is clicked', () => {
    const handleToggle = vi.fn();
    render(
      <Dark><NodeDetailPanel {...defaultProps} onToggleEnabled={handleToggle} /></Dark>,
    );
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(handleToggle).toHaveBeenCalledWith(false);
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Dark><NodeDetailPanel {...defaultProps} onClose={handleClose} /></Dark>,
    );
    fireEvent.click(screen.getByLabelText('Close panel'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows delete confirmation on delete button click', () => {
    const handleDelete = vi.fn();
    render(
      <Dark><NodeDetailPanel {...defaultProps} onDelete={handleDelete} /></Dark>,
    );
    fireEvent.click(screen.getByText('Delete Node'));
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
  });

  it('calls onDelete when deletion is confirmed', () => {
    const handleDelete = vi.fn();
    render(
      <Dark><NodeDetailPanel {...defaultProps} onDelete={handleDelete} /></Dark>,
    );
    fireEvent.click(screen.getByText('Delete Node'));
    fireEvent.click(screen.getByText('Confirm Delete'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Saving state
// ---------------------------------------------------------------------------

describe('NodeDetailPanel -- saving', () => {
  it('shows saving indicator', () => {
    render(<Dark><NodeDetailPanel {...defaultProps} saving /></Dark>);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});
