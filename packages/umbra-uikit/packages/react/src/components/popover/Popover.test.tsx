/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { popoverPlacements, popoverAligns } from '@coexist/wisp-core/types/Popover.types';
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

function renderPopover(props: Record<string, unknown> = {}) {
  return render(
    <Dark>
      <Popover {...props}>
        <PopoverTrigger>
          <button>Toggle</button>
        </PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Popover — rendering', () => {
  it('renders the trigger element', () => {
    renderPopover();
    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    renderPopover();
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });

  it('renders content when defaultOpen=true', () => {
    renderPopover({ defaultOpen: true });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Opening / closing (uncontrolled)
// ---------------------------------------------------------------------------

describe('Popover — uncontrolled open/close', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on trigger click', () => {
    renderPopover();
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('closes on second trigger click', () => {
    renderPopover();
    const trigger = screen.getByText('Toggle');
    fireEvent.click(trigger);
    expect(screen.getByText('Popover body')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });

  it('calls onOpenChange with true when opening', () => {
    const handleOpenChange = vi.fn();
    renderPopover({ onOpenChange: handleOpenChange });
    fireEvent.click(screen.getByText('Toggle'));
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange with false when closing', () => {
    const handleOpenChange = vi.fn();
    renderPopover({ onOpenChange: handleOpenChange, defaultOpen: true });
    fireEvent.click(screen.getByText('Toggle'));
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// Controlled usage
// ---------------------------------------------------------------------------

describe('Popover — controlled usage', () => {
  it('opens when controlled open=true', () => {
    renderPopover({ open: true });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('stays closed when controlled open=false', () => {
    renderPopover({ open: false });
    fireEvent.click(screen.getByText('Toggle'));
    // In controlled mode, clicking does not auto-open
    // But onOpenChange would be called. The component stays closed because open=false
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close on Escape
// ---------------------------------------------------------------------------

describe('Popover — close on Escape', () => {
  it('closes popover on Escape key', () => {
    renderPopover({ defaultOpen: true });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close on outside click
// ---------------------------------------------------------------------------

describe('Popover — close on outside click', () => {
  it('closes popover on outside mousedown', () => {
    renderPopover({ defaultOpen: true });
    expect(screen.getByText('Popover body')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Placements
// ---------------------------------------------------------------------------

describe('Popover — placements', () => {
  popoverPlacements.forEach((placement) => {
    it(`renders with placement="${placement}" without crashing`, () => {
      renderPopover({ placement, defaultOpen: true });
      expect(screen.getByText('Popover body')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Alignments
// ---------------------------------------------------------------------------

describe('Popover — alignments', () => {
  popoverAligns.forEach((align) => {
    it(`renders with align="${align}" without crashing`, () => {
      renderPopover({ align, defaultOpen: true });
      expect(screen.getByText('Popover body')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Popover — accessibility', () => {
  it('trigger has aria-haspopup=dialog', () => {
    renderPopover();
    expect(screen.getByText('Toggle')).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('trigger has aria-expanded=false when closed', () => {
    renderPopover();
    expect(screen.getByText('Toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  it('trigger has aria-expanded=true when open', () => {
    renderPopover({ defaultOpen: true });
    expect(screen.getByText('Toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  it('content has role=dialog', () => {
    renderPopover({ defaultOpen: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Portal rendering
// ---------------------------------------------------------------------------

describe('Popover — portal', () => {
  it('renders content into document.body via portal', () => {
    renderPopover({ defaultOpen: true });
    const dialog = screen.getByRole('dialog');
    expect(dialog.parentElement).toBe(document.body);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Popover — className passthrough', () => {
  it('passes className to PopoverContent', () => {
    render(
      <Dark>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button>Toggle</button>
          </PopoverTrigger>
          <PopoverContent className="content-custom">Body</PopoverContent>
        </Popover>
      </Dark>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('content-custom');
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('Popover — style merge', () => {
  it('merges user style onto PopoverContent', () => {
    render(
      <Dark>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button>Toggle</button>
          </PopoverTrigger>
          <PopoverContent style={{ marginTop: 42 }}>Body</PopoverContent>
        </Popover>
      </Dark>,
    );
    expect(screen.getByRole('dialog')).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('Popover — ref forwarding', () => {
  it('forwards ref to PopoverContent div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button>Toggle</button>
          </PopoverTrigger>
          <PopoverContent ref={ref}>Body</PopoverContent>
        </Popover>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
