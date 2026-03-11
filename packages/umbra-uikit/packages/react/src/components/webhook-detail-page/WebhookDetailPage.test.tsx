/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WebhookDetailPage } from './WebhookDetailPage';
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
  name: 'GitHub Bot',
  channelName: 'dev',
  token: 'abc123xyz456def789',
  createdBy: 'Admin',
  createdAt: '2024-01-15',
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('WebhookDetailPage — rendering', () => {
  it('renders webhook name', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText('GitHub Bot')).toBeInTheDocument();
  });

  it('renders channel name', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText('#dev')).toBeInTheDocument();
  });

  it('renders created by info', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText(/Created by Admin on 2024-01-15/)).toBeInTheDocument();
  });

  it('renders name input with current value', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onNameChange={() => {}} />
      </Dark>,
    );
    const input = screen.getByLabelText('Webhook name') as HTMLInputElement;
    expect(input.value).toBe('GitHub Bot');
  });

  it('renders token display', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} />
      </Dark>,
    );
    const tokenField = screen.getByLabelText('Webhook token');
    expect(tokenField).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Name change
// ---------------------------------------------------------------------------

describe('WebhookDetailPage — name change', () => {
  it('calls onNameChange when name input changes', () => {
    const onNameChange = vi.fn();
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onNameChange={onNameChange} />
      </Dark>,
    );
    fireEvent.change(screen.getByLabelText('Webhook name'), { target: { value: 'New Bot' } });
    expect(onNameChange).toHaveBeenCalledWith('New Bot');
  });
});

// ---------------------------------------------------------------------------
// Copy token
// ---------------------------------------------------------------------------

describe('WebhookDetailPage — copy token', () => {
  it('renders copy button when onCopyToken is provided', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onCopyToken={() => {}} />
      </Dark>,
    );
    expect(screen.getByLabelText('Copy token')).toBeInTheDocument();
  });

  it('calls onCopyToken with token value', () => {
    const onCopyToken = vi.fn();
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onCopyToken={onCopyToken} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Copy token'));
    expect(onCopyToken).toHaveBeenCalledWith('abc123xyz456def789');
  });
});

// ---------------------------------------------------------------------------
// Regenerate token
// ---------------------------------------------------------------------------

describe('WebhookDetailPage — regenerate token', () => {
  it('renders regenerate button when onRegenerateToken is provided', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onRegenerateToken={() => {}} />
      </Dark>,
    );
    expect(screen.getByLabelText('Regenerate token')).toBeInTheDocument();
  });

  it('shows confirmation dialog when regenerate is clicked', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onRegenerateToken={() => {}} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Regenerate token'));
    expect(screen.getByLabelText('Confirm regenerate token')).toBeInTheDocument();
  });

  it('calls onRegenerateToken after confirmation', () => {
    const onRegenerateToken = vi.fn();
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onRegenerateToken={onRegenerateToken} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Regenerate token'));
    // After clicking Regenerate token, a confirmation dialog opens with a 'Regenerate' button
    // There may be multiple 'Regenerate' texts (the original button + confirmation button)
    const regenerateButtons = screen.getAllByText('Regenerate');
    // Click the last one (the confirmation button in the dialog)
    fireEvent.click(regenerateButtons[regenerateButtons.length - 1]);
    expect(onRegenerateToken).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

describe('WebhookDetailPage — save', () => {
  it('renders save button when onSave is provided', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onSave={() => {}} />
      </Dark>,
    );
    expect(screen.getByLabelText('Save changes')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onSave={onSave} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Save changes'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('shows saving text when saving is true', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onSave={() => {}} saving />
      </Dark>,
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

describe('WebhookDetailPage — delete', () => {
  it('renders delete button when onDelete is provided', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onDelete={() => {}} />
      </Dark>,
    );
    expect(screen.getByLabelText('Delete webhook')).toBeInTheDocument();
  });

  it('shows confirmation dialog when delete is clicked', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onDelete={() => {}} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Delete webhook'));
    expect(screen.getByLabelText('Confirm delete webhook')).toBeInTheDocument();
  });

  it('calls onDelete after confirmation', () => {
    const onDelete = vi.fn();
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} onDelete={onDelete} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Delete webhook'));
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('WebhookDetailPage — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <WebhookDetailPage {...defaultProps} skeleton />
      </Dark>,
    );
    const el = container.querySelector('div[aria-hidden]');
    expect(el).toBeInTheDocument();
  });

  it('does not render webhook details in skeleton mode', () => {
    render(
      <Dark>
        <WebhookDetailPage {...defaultProps} skeleton />
      </Dark>,
    );
    expect(screen.queryByText('GitHub Bot')).not.toBeInTheDocument();
  });
});
