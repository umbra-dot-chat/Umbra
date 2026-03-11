/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from './ContextMenu';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ContextMenu — rendering', () => {
  it('renders trigger children', () => {
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Right-click me</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Cut</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );
    expect(screen.getByText('Right-click me')).toBeInTheDocument();
  });

  it('does not show content initially', () => {
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Trigger</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Cut</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Open on right-click
// ---------------------------------------------------------------------------

describe('ContextMenu — open on right-click', () => {
  it('shows content after right-click on trigger', () => {
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Trigger</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Cut</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );

    fireEvent.contextMenu(screen.getByText('Trigger'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Cut')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close on Escape
// ---------------------------------------------------------------------------

describe('ContextMenu — close on Escape', () => {
  it('closes menu when Escape is pressed', () => {
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Trigger</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Cut</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );

    fireEvent.contextMenu(screen.getByText('Trigger'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MenuItem
// ---------------------------------------------------------------------------

describe('ContextMenu — items', () => {
  it('renders menu items with role="menuitem"', () => {
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Trigger</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Cut</ContextMenuItem>
            <ContextMenuItem>Copy</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );

    fireEvent.contextMenu(screen.getByText('Trigger'));
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('calls onSelect when item is clicked', () => {
    const onSelect = vi.fn();
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Trigger</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={onSelect}>Cut</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );

    fireEvent.contextMenu(screen.getByText('Trigger'));
    fireEvent.click(screen.getByText('Cut'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('does not call onSelect when disabled', () => {
    const onSelect = vi.fn();
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Trigger</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={onSelect} disabled>
              Cut
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );

    fireEvent.contextMenu(screen.getByText('Trigger'));
    fireEvent.click(screen.getByText('Cut'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders shortcut text when provided', () => {
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Trigger</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem shortcut="⌘X">Cut</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );

    fireEvent.contextMenu(screen.getByText('Trigger'));
    expect(screen.getByText('⌘X')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

describe('ContextMenu — separator', () => {
  it('renders separator with role="separator"', () => {
    render(
      <Dark>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>Trigger</div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Cut</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Paste</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dark>,
    );

    fireEvent.contextMenu(screen.getByText('Trigger'));
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
