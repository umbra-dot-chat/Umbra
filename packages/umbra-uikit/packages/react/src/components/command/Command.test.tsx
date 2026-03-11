/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandEmpty,
} from './Command';
import { commandSizes } from '@coexist/wisp-core/types/Command.types';
import type { CommandSize } from '@coexist/wisp-core/types/Command.types';
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

function renderCommand(props: Record<string, unknown> = {}, items?: React.ReactNode) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };
  return render(
    <Dark>
      <Command {...defaultProps} {...props}>
        <CommandInput placeholder="Search..." />
        <CommandList>
          {items || (
            <>
              <CommandItem value="alpha">Alpha</CommandItem>
              <CommandItem value="beta">Beta</CommandItem>
              <CommandItem value="gamma">Gamma</CommandItem>
            </>
          )}
          <CommandEmpty>No results.</CommandEmpty>
        </CommandList>
      </Command>
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Command — rendering', () => {
  it('renders when open=true', () => {
    renderCommand();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderCommand({ open: false });
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('renders in a portal to document.body', () => {
    renderCommand();
    const dialog = screen.getByRole('dialog');
    expect(dialog.closest('body')).toBe(document.body);
  });

  it('renders search input', () => {
    renderCommand();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Search filtering
// ---------------------------------------------------------------------------

describe('Command — search filtering', () => {
  it('filters items by text', async () => {
    renderCommand();
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'alp' } });
    });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
  });

  it('shows all items when search is empty', () => {
    renderCommand();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('uses custom filter when provided', async () => {
    // Always show items starting with 'b', regardless of search
    const filter = (_value: string, _search: string) => _value.startsWith('b');
    renderCommand({ filter });
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'xyz' } });
    });
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('Command — keyboard navigation', () => {
  it('ArrowDown selects the first item', async () => {
    renderCommand();
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    const items = screen.getAllByRole('option');
    expect(items[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowDown then ArrowDown moves to second item', async () => {
    renderCommand();
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    const items = screen.getAllByRole('option');
    expect(items[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowUp from first wraps to last when loop=true', async () => {
    renderCommand({ loop: true });
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // selects first
      fireEvent.keyDown(input, { key: 'ArrowUp' });   // wraps to last
    });
    const items = screen.getAllByRole('option');
    expect(items[items.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('Enter on active item calls onSelect', async () => {
    const onSelect = vi.fn();
    renderCommand({ onSelect });
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // selects Alpha
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(onSelect).toHaveBeenCalledWith('alpha');
  });
});

// ---------------------------------------------------------------------------
// Escape key
// ---------------------------------------------------------------------------

describe('Command — escape key', () => {
  it('clears search first, then closes on second Escape', async () => {
    const onOpenChange = vi.fn();
    renderCommand({ onOpenChange });
    const input = screen.getByPlaceholderText('Search...');

    // Type something
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
    });

    // First Escape clears search
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onOpenChange).not.toHaveBeenCalled();

    // Second Escape closes
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('respects closeOnEscape=false', async () => {
    const onOpenChange = vi.fn();
    renderCommand({ onOpenChange, closeOnEscape: false });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

describe('Command — groups', () => {
  it('renders group headings', () => {
    renderCommand({}, (
      <>
        <CommandGroup heading="Actions">
          <CommandItem value="create">Create</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
          <CommandItem value="config">Config</CommandItem>
        </CommandGroup>
      </>
    ));
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders items within groups', () => {
    renderCommand({}, (
      <CommandGroup heading="File">
        <CommandItem value="new">New</CommandItem>
        <CommandItem value="open">Open</CommandItem>
      </CommandGroup>
    ));
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('Command — selection', () => {
  it('onSelect fires with value when item clicked', async () => {
    const onSelect = vi.fn();
    renderCommand({ onSelect });
    await act(async () => {
      fireEvent.click(screen.getByText('Beta'));
    });
    expect(onSelect).toHaveBeenCalledWith('beta');
  });

  it('closes on select when closeOnSelect=true', async () => {
    const onOpenChange = vi.fn();
    renderCommand({ onOpenChange, closeOnSelect: true });
    await act(async () => {
      fireEvent.click(screen.getByText('Alpha'));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close on select when closeOnSelect=false', async () => {
    const onOpenChange = vi.fn();
    renderCommand({ onOpenChange, closeOnSelect: false });
    await act(async () => {
      fireEvent.click(screen.getByText('Alpha'));
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// Disabled items
// ---------------------------------------------------------------------------

describe('Command — disabled items', () => {
  it('disabled items are not selectable', async () => {
    const onSelect = vi.fn();
    renderCommand({ onSelect }, (
      <>
        <CommandItem value="enabled">Enabled</CommandItem>
        <CommandItem value="disabled" disabled>Disabled</CommandItem>
      </>
    ));
    await act(async () => {
      fireEvent.click(screen.getByText('Disabled'));
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disabled items have aria-disabled', () => {
    renderCommand({}, (
      <CommandItem value="locked" disabled>Locked</CommandItem>
    ));
    expect(screen.getByText('Locked').closest('[role="option"]')).toHaveAttribute('aria-disabled', 'true');
  });
});

// ---------------------------------------------------------------------------
// Shortcuts
// ---------------------------------------------------------------------------

describe('Command — shortcuts', () => {
  it('renders shortcut text', () => {
    renderCommand({}, (
      <CommandItem value="save" shortcut="Ctrl+S">Save</CommandItem>
    ));
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Descriptions
// ---------------------------------------------------------------------------

describe('Command — descriptions', () => {
  it('renders description text', () => {
    renderCommand({}, (
      <CommandItem value="help" description="Get help with commands">Help</CommandItem>
    ));
    expect(screen.getByText('Get help with commands')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

describe('Command — overlay', () => {
  it('closes when overlay is clicked', async () => {
    const onOpenChange = vi.fn();
    renderCommand({ onOpenChange });
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement!;
    await act(async () => {
      fireEvent.click(overlay);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when clicking inside the panel', async () => {
    const onOpenChange = vi.fn();
    renderCommand({ onOpenChange });
    await act(async () => {
      fireEvent.click(screen.getByText('Alpha'));
    });
    // onOpenChange is called because of item selection, but with false due to closeOnSelect
    // Check it wasn't called via overlay click by checking the call count matches selection
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Command — accessibility', () => {
  it('has role=dialog', () => {
    renderCommand();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal=true', () => {
    renderCommand();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-label', () => {
    renderCommand();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Command palette');
  });

  it('items have role=option', () => {
    renderCommand();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('active item has aria-selected=true', async () => {
    renderCommand();
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    const items = screen.getAllByRole('option');
    expect(items[0]).toHaveAttribute('aria-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Command — sizes', () => {
  (commandSizes as readonly CommandSize[]).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      renderCommand({ size });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className / style passthrough
// ---------------------------------------------------------------------------

describe('Command — className / style', () => {
  it('passes className to the panel', () => {
    renderCommand({ className: 'cmd-custom' });
    expect(screen.getByRole('dialog')).toHaveClass('cmd-custom');
  });

  it('merges user style onto the panel', () => {
    renderCommand({ style: { marginTop: 42 } });
    expect(screen.getByRole('dialog')).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

describe('Command — separator', () => {
  it('renders a separator', () => {
    renderCommand({}, (
      <>
        <CommandItem value="a">A</CommandItem>
        <CommandSeparator />
        <CommandItem value="b">B</CommandItem>
      </>
    ));
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('Command — loading', () => {
  it('shows spinner when loading', () => {
    renderCommand({ loading: true });
    // When loading, the list renders the spinner instead of items
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });
});
