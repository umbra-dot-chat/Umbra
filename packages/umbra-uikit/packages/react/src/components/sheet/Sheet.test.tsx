/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sheet } from './Sheet';
import { sheetSizes } from '@coexist/wisp-core/types/Sheet.types';
import type { SheetSize } from '@coexist/wisp-core/types/Sheet.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// The Sheet uses requestAnimationFrame and setTimeout for animation.
// We mock both to control the mount/animate lifecycle.

function renderSheet(props: Record<string, unknown> = {}) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };
  return render(
    <Dark>
      <Sheet {...defaultProps} {...props}>
        <p>Sheet content</p>
      </Sheet>
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Sheet — rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders when open=true', () => {
    renderSheet();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderSheet({ open: false });
    // After unmount timer expires
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('renders in a portal to document.body', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    expect(dialog.closest('body')).toBe(document.body);
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Sheet — sizes', () => {
  (sheetSizes as readonly SheetSize[]).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      renderSheet({ size });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Close on Escape
// ---------------------------------------------------------------------------

describe('Sheet — close on Escape', () => {
  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    renderSheet({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closeOnEscape=false', () => {
    const onClose = vi.fn();
    renderSheet({ onClose, closeOnEscape: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Close on overlay click
// ---------------------------------------------------------------------------

describe('Sheet — close on overlay click', () => {
  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    renderSheet({ onClose });
    // The overlay is the sibling of the dialog rendered via portal
    // Find all aria-hidden elements in the body that are siblings of the dialog
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.previousElementSibling;
    expect(overlay).toBeTruthy();
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when closeOnOverlayClick=false', () => {
    const onClose = vi.fn();
    renderSheet({ onClose, closeOnOverlayClick: false });
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.previousElementSibling;
    if (overlay) fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

describe('Sheet — overlay', () => {
  it('renders overlay by default', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.previousElementSibling;
    expect(overlay).toBeTruthy();
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render overlay when overlay=false', () => {
    renderSheet({ overlay: false });
    const dialog = screen.getByRole('dialog');
    // No aria-hidden overlay sibling
    const overlay = dialog.previousElementSibling;
    if (overlay) {
      expect(overlay).not.toHaveAttribute('aria-hidden', 'true');
    }
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Sheet — accessibility', () => {
  it('has role=dialog', () => {
    renderSheet();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal=true', () => {
    renderSheet();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Sheet — className passthrough', () => {
  it('passes className to the sheet panel', () => {
    renderSheet({ className: 'sheet-custom' });
    expect(screen.getByRole('dialog')).toHaveClass('sheet-custom');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Sheet — style merge', () => {
  it('merges user style onto the sheet panel', () => {
    renderSheet({ style: { marginTop: 42 } });
    expect(screen.getByRole('dialog')).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Sheet — ref forwarding', () => {
  it('forwards ref to the sheet panel div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Sheet open onClose={() => {}} ref={ref}>
          <p>Content</p>
        </Sheet>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Body scroll lock
// ---------------------------------------------------------------------------

describe('Sheet — body scroll lock', () => {
  it('sets body overflow to hidden when open', () => {
    renderSheet();
    expect(document.body.style.overflow).toBe('hidden');
  });
});
