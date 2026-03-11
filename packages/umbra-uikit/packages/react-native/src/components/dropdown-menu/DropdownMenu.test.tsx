/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './DropdownMenu';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('DropdownMenu — rendering', () => {
  it('renders trigger text', () => {
    render(
      <Wrapper>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <span>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Wrapper>,
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('does not show items when closed by default', () => {
    render(
      <Wrapper>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <span>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Hidden item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Wrapper>,
    );
    expect(screen.queryByText('Hidden item')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Open / close
// ---------------------------------------------------------------------------

describe('DropdownMenu — open/close', () => {
  it('shows items when controlled open is true', () => {
    render(
      <Wrapper>
        <DropdownMenu open>
          <DropdownMenuTrigger>
            <span>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Visible item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Wrapper>,
    );
    expect(screen.getByText('Visible item')).toBeInTheDocument();
  });

  it('shows items after clicking trigger (uncontrolled)', () => {
    render(
      <Wrapper>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <span>Open menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action A</DropdownMenuItem>
            <DropdownMenuItem>Action B</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Wrapper>,
    );
    const trigger = screen.getByText('Open menu').closest('[role="button"]');
    fireEvent.click(trigger!);
    expect(screen.getByText('Action A')).toBeInTheDocument();
    expect(screen.getByText('Action B')).toBeInTheDocument();
  });

  it('calls onOpenChange when trigger is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <Wrapper>
        <DropdownMenu onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>
            <span>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Wrapper>,
    );
    const trigger = screen.getByText('Menu').closest('[role="button"]');
    fireEvent.click(trigger!);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// MenuItem onSelect
// ---------------------------------------------------------------------------

describe('DropdownMenu — item selection', () => {
  it('calls onSelect when a menu item is clicked', () => {
    const onSelect = vi.fn();
    render(
      <Wrapper>
        <DropdownMenu open>
          <DropdownMenuTrigger>
            <span>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onSelect}>Click me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Wrapper>,
    );
    const item = screen.getByText('Click me').closest('[role="menuitem"]');
    fireEvent.click(item!);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not call onSelect when item is disabled', () => {
    const onSelect = vi.fn();
    render(
      <Wrapper>
        <DropdownMenu open>
          <DropdownMenuTrigger>
            <span>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onSelect} disabled>
              Disabled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Wrapper>,
    );
    const item = screen.getByText('Disabled').closest('[role="menuitem"]');
    fireEvent.click(item!);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

describe('DropdownMenu — separator', () => {
  it('renders separator without crashing', () => {
    const { container } = render(
      <Wrapper>
        <DropdownMenu open>
          <DropdownMenuTrigger>
            <span>Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>First</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Second</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
