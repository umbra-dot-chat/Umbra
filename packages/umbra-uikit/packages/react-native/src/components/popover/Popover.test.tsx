/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
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

describe('Popover — rendering', () => {
  it('renders trigger text', () => {
    render(
      <Wrapper>
        <Popover>
          <PopoverTrigger>
            <span>Open popover</span>
          </PopoverTrigger>
          <PopoverContent>
            <span>Popover body</span>
          </PopoverContent>
        </Popover>
      </Wrapper>,
    );
    expect(screen.getByText('Open popover')).toBeInTheDocument();
  });

  it('does not show content when closed by default', () => {
    render(
      <Wrapper>
        <Popover>
          <PopoverTrigger>
            <span>Toggle</span>
          </PopoverTrigger>
          <PopoverContent>
            <span>Hidden body</span>
          </PopoverContent>
        </Popover>
      </Wrapper>,
    );
    expect(screen.queryByText('Hidden body')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Open / close
// ---------------------------------------------------------------------------

describe('Popover — open/close', () => {
  it('shows content when controlled open is true', () => {
    render(
      <Wrapper>
        <Popover open>
          <PopoverTrigger>
            <span>Trigger</span>
          </PopoverTrigger>
          <PopoverContent>
            <span>Visible body</span>
          </PopoverContent>
        </Popover>
      </Wrapper>,
    );
    expect(screen.getByText('Visible body')).toBeInTheDocument();
  });

  it('shows content after clicking trigger (uncontrolled)', () => {
    render(
      <Wrapper>
        <Popover>
          <PopoverTrigger>
            <span>Click me</span>
          </PopoverTrigger>
          <PopoverContent>
            <span>Now visible</span>
          </PopoverContent>
        </Popover>
      </Wrapper>,
    );
    // Click the trigger button
    const trigger = screen.getByText('Click me').closest('[role="button"]');
    fireEvent.click(trigger!);
    expect(screen.getByText('Now visible')).toBeInTheDocument();
  });

  it('calls onOpenChange when trigger is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <Wrapper>
        <Popover onOpenChange={onOpenChange}>
          <PopoverTrigger>
            <span>Trigger</span>
          </PopoverTrigger>
          <PopoverContent>
            <span>Body</span>
          </PopoverContent>
        </Popover>
      </Wrapper>,
    );
    const trigger = screen.getByText('Trigger').closest('[role="button"]');
    fireEvent.click(trigger!);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

describe('Popover — placement', () => {
  const placements = ['top', 'bottom', 'left', 'right'] as const;

  placements.forEach((placement) => {
    it(`renders with placement="${placement}" without crashing`, () => {
      render(
        <Wrapper>
          <Popover placement={placement} open>
            <PopoverTrigger>
              <span>Trigger</span>
            </PopoverTrigger>
            <PopoverContent>
              <span>{placement} content</span>
            </PopoverContent>
          </Popover>
        </Wrapper>,
      );
      expect(screen.getByText(`${placement} content`)).toBeInTheDocument();
    });
  });
});
