/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommunityCreateDialog } from './CommunityCreateDialog';
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
  };
  return render(
    <Dark>
      <CommunityCreateDialog {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('CommunityCreateDialog -- rendering', () => {
  it('renders when open=true', () => {
    renderDialog();
    expect(screen.getByText('Create Community')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Create Community')).not.toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderDialog({ title: 'New Group' });
    expect(screen.getByText('New Group')).toBeInTheDocument();
  });

  it('renders name and description inputs', () => {
    renderDialog();
    expect(screen.getByPlaceholderText('Enter community name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What is this community about?')).toBeInTheDocument();
  });

  it('renders Cancel and Create buttons', () => {
    renderDialog();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

describe('CommunityCreateDialog -- close', () => {
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

describe('CommunityCreateDialog -- submit', () => {
  it('calls onSubmit with form data when Create is clicked', () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    const nameInput = screen.getByPlaceholderText('Enter community name');
    fireEvent.change(nameInput, { target: { value: 'My Community' } });

    const descInput = screen.getByPlaceholderText('What is this community about?');
    fireEvent.change(descInput, { target: { value: 'A test community' } });

    fireEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Community',
        description: 'A test community',
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

describe('CommunityCreateDialog -- error', () => {
  it('displays error message when error prop is set', () => {
    renderDialog({ error: 'Name already taken' });
    expect(screen.getByText('Name already taken')).toBeInTheDocument();
  });

  it('error element has role=alert', () => {
    renderDialog({ error: 'Name already taken' });
    expect(screen.getByRole('alert')).toHaveTextContent('Name already taken');
  });
});

// ---------------------------------------------------------------------------
// Submitting
// ---------------------------------------------------------------------------

describe('CommunityCreateDialog -- submitting', () => {
  it('disables Cancel button when submitting', () => {
    renderDialog({ submitting: true });
    const cancelButton = screen.getByText('Cancel').closest('button');
    expect(cancelButton).toBeDisabled();
  });

  it('disables name input when submitting', () => {
    renderDialog({ submitting: true });
    expect(screen.getByPlaceholderText('Enter community name')).toBeDisabled();
  });
});
