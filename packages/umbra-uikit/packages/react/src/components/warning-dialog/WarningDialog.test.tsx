/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WarningDialog } from './WarningDialog';
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
      <WarningDialog {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('WarningDialog -- rendering', () => {
  it('renders when open=true', () => {
    renderDialog();
    expect(screen.getByText('Issue Warning')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Issue Warning')).not.toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderDialog({ title: 'Warn Member' });
    expect(screen.getByText('Warn Member')).toBeInTheDocument();
  });

  it('renders member name', () => {
    renderDialog();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('renders reason input', () => {
    renderDialog();
    expect(screen.getByPlaceholderText('Enter warning reason')).toBeInTheDocument();
  });

  it('renders Cancel and Submit Warning buttons', () => {
    renderDialog();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit Warning')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('WarningDialog -- close', () => {
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

describe('WarningDialog -- submit', () => {
  it('calls onSubmit with form data when Submit Warning is clicked', () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    const reasonInput = screen.getByPlaceholderText('Enter warning reason');
    fireEvent.change(reasonInput, { target: { value: 'Spam messages' } });

    fireEvent.click(screen.getByText('Submit Warning'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Spam messages',
      }),
    );
  });

  it('does not call onSubmit when reason is empty', () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });
    fireEvent.click(screen.getByText('Submit Warning'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

describe('WarningDialog -- error', () => {
  it('displays error message when error prop is set', () => {
    renderDialog({ error: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('error element has role=alert', () => {
    renderDialog({ error: 'Something went wrong' });
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
});

// ---------------------------------------------------------------------------
// Submitting
// ---------------------------------------------------------------------------

describe('WarningDialog -- submitting', () => {
  it('disables Cancel button when submitting', () => {
    renderDialog({ submitting: true });
    const cancelButton = screen.getByText('Cancel').closest('button');
    expect(cancelButton).toBeDisabled();
  });

  it('disables reason input when submitting', () => {
    renderDialog({ submitting: true });
    expect(screen.getByPlaceholderText('Enter warning reason')).toBeDisabled();
  });
});
