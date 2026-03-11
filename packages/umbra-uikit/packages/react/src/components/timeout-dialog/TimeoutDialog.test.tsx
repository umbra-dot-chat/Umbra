/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimeoutDialog } from './TimeoutDialog';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderDialog(props: Record<string, unknown> = {}) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    memberName: 'TestUser',
  };
  return render(
    <Dark>
      <TimeoutDialog {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('TimeoutDialog -- rendering', () => {
  it('renders when open=true', () => {
    renderDialog();
    expect(screen.getByText('Timeout Member')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Timeout Member')).not.toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderDialog({ title: 'Mute User' });
    expect(screen.getByText('Mute User')).toBeInTheDocument();
  });

  it('renders member name', () => {
    renderDialog();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('renders duration select with presets', () => {
    renderDialog();
    expect(screen.getByLabelText('Timeout duration')).toBeInTheDocument();
    expect(screen.getByText('60 seconds')).toBeInTheDocument();
    expect(screen.getByText('5 minutes')).toBeInTheDocument();
    expect(screen.getByText('1 hour')).toBeInTheDocument();
    expect(screen.getByText('1 day')).toBeInTheDocument();
    expect(screen.getByText('1 week')).toBeInTheDocument();
  });

  it('renders type select', () => {
    renderDialog();
    expect(screen.getByLabelText('Timeout type')).toBeInTheDocument();
    expect(screen.getByText('Mute')).toBeInTheDocument();
    expect(screen.getByText('Restrict')).toBeInTheDocument();
  });

  it('renders Cancel and Apply Timeout buttons', () => {
    renderDialog();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Apply Timeout')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('TimeoutDialog -- close', () => {
  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

describe('TimeoutDialog -- submit', () => {
  it('calls onSubmit with form data when Apply Timeout is clicked', () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    fireEvent.click(screen.getByText('Apply Timeout'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 60,
        type: 'mute',
      }),
    );
  });

  it('includes reason when provided', () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    const reasonInput = screen.getByPlaceholderText('Enter timeout reason');
    fireEvent.change(reasonInput, { target: { value: 'Spam' } });

    fireEvent.click(screen.getByText('Apply Timeout'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Spam',
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('TimeoutDialog -- error', () => {
  it('displays error message when error prop is set', () => {
    renderDialog({ error: 'Failed to apply timeout' });
    expect(screen.getByText('Failed to apply timeout')).toBeInTheDocument();
  });

  it('error element has role=alert', () => {
    renderDialog({ error: 'Failed to apply timeout' });
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to apply timeout');
  });
});

// ---------------------------------------------------------------------------
// Submitting
// ---------------------------------------------------------------------------

describe('TimeoutDialog -- submitting', () => {
  it('disables Cancel button when submitting', () => {
    renderDialog({ submitting: true });
    const cancelButton = screen.getByText('Cancel').closest('button');
    expect(cancelButton).toBeDisabled();
  });
});
