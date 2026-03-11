/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dialog } from './Dialog';
import { dialogSizes } from '@coexist/wisp-core/types/Dialog.types';
import type { DialogSize } from '@coexist/wisp-core/types/Dialog.types';
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
    title: 'Dialog Title',
  };
  return render(
    <Dark>
      <Dialog {...defaultProps} {...props}>
        <p>Dialog body</p>
      </Dialog>
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Dialog — rendering', () => {
  it('renders when open=true', () => {
    renderDialog();
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
  });

  it('renders title', () => {
    renderDialog({ title: 'My Title' });
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    renderDialog({ description: 'Some description' });
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    renderDialog({ footer: <button>Confirm</button> });
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders in a portal to document.body', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    // The dialog panel is inside an overlay div that is a direct child of body
    expect(dialog.closest('body')).toBe(document.body);
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Dialog — sizes', () => {
  (dialogSizes as readonly DialogSize[]).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      renderDialog({ size });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

describe('Dialog — close button', () => {
  it('renders close button by default', () => {
    renderDialog();
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides close button when showCloseButton=false', () => {
    renderDialog({ showCloseButton: false });
    expect(screen.queryByLabelText('Close dialog')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close on Escape
// ---------------------------------------------------------------------------

describe('Dialog — close on Escape', () => {
  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closeOnEscape=false', () => {
    const onClose = vi.fn();
    renderDialog({ onClose, closeOnEscape: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Close on overlay click
// ---------------------------------------------------------------------------

describe('Dialog — close on overlay click', () => {
  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    // The overlay is the direct parent of the dialog panel
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when overlay click is disabled', () => {
    const onClose = vi.fn();
    renderDialog({ onClose, closeOnOverlayClick: false });
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement!;
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close when clicking inside the dialog panel', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(screen.getByText('Dialog body'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Dialog — accessibility', () => {
  it('dialog has role=dialog', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('dialog has aria-modal=true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('dialog has aria-labelledby pointing to title', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const title = document.getElementById(labelledBy!);
    expect(title?.textContent).toBe('Dialog Title');
  });

  it('dialog has aria-describedby when description is set', () => {
    renderDialog({ description: 'A description' });
    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const desc = document.getElementById(describedBy!);
    expect(desc?.textContent).toBe('A description');
  });

  it('dialog does not have aria-describedby when no description', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-describedby')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Dialog — className passthrough', () => {
  it('passes className to the dialog panel', () => {
    renderDialog({ className: 'dialog-custom' });
    expect(screen.getByRole('dialog')).toHaveClass('dialog-custom');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Dialog — style merge', () => {
  it('merges user style onto the dialog panel', () => {
    renderDialog({ style: { marginTop: 42 } });
    expect(screen.getByRole('dialog')).toHaveStyle({ marginTop: '42px' });
  });
});
