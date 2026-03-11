/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, CommandSeparator } from './Command';
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

describe('Command — rendering', () => {
  it('renders without crashing when open', () => {
    const { container } = render(
      <Wrapper>
        <Command open onOpenChange={vi.fn()}>
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
  });

  it('renders children content', () => {
    render(
      <Wrapper>
        <Command open onOpenChange={vi.fn()}>
          <CommandList>
            <CommandItem value="hello">Hello World</CommandItem>
          </CommandList>
        </Command>
      </Wrapper>,
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    const { container } = render(
      <Wrapper>
        <Command open={false} onOpenChange={vi.fn()}>
          <CommandList>
            <CommandItem value="hidden">Hidden Item</CommandItem>
          </CommandList>
        </Command>
      </Wrapper>,
    );
    expect(screen.queryByText('Hidden Item')).toBeNull();
  });

  it('has correct displayName', () => {
    expect(Command.displayName).toBe('Command');
  });
});

// ---------------------------------------------------------------------------
// Compound components
// ---------------------------------------------------------------------------

describe('Command — compound components', () => {
  it('renders CommandGroup with heading', () => {
    render(
      <Wrapper>
        <Command open onOpenChange={vi.fn()}>
          <CommandList>
            <CommandGroup heading="ACTIONS">
              <CommandItem value="run">Run</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Wrapper>,
    );
    expect(screen.getByText('ACTIONS')).toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('renders CommandEmpty with default text', () => {
    render(
      <Wrapper>
        <Command open onOpenChange={vi.fn()}>
          <CommandList>
            <CommandEmpty />
          </CommandList>
        </Command>
      </Wrapper>,
    );
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('renders CommandEmpty with custom text', () => {
    render(
      <Wrapper>
        <Command open onOpenChange={vi.fn()}>
          <CommandList>
            <CommandEmpty>Nothing here</CommandEmpty>
          </CommandList>
        </Command>
      </Wrapper>,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders CommandSeparator without crashing', () => {
    const { container } = render(
      <Wrapper>
        <Command open onOpenChange={vi.fn()}>
          <CommandList>
            <CommandItem value="a">A</CommandItem>
            <CommandSeparator />
            <CommandItem value="b">B</CommandItem>
          </CommandList>
        </Command>
      </Wrapper>,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Display names
// ---------------------------------------------------------------------------

describe('Command — display names', () => {
  it('has correct displayName for all sub-components', () => {
    expect(CommandInput.displayName).toBe('CommandInput');
    expect(CommandList.displayName).toBe('CommandList');
    expect(CommandGroup.displayName).toBe('CommandGroup');
    expect(CommandItem.displayName).toBe('CommandItem');
    expect(CommandSeparator.displayName).toBe('CommandSeparator');
    expect(CommandEmpty.displayName).toBe('CommandEmpty');
  });
});
