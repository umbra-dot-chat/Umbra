/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SystemMessageRenderer } from './SystemMessageRenderer';
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

describe('SystemMessageRenderer — rendering', () => {
  it('renders content text', () => {
    render(
      <Dark>
        <SystemMessageRenderer content="Alice joined the channel" />
      </Dark>,
    );
    expect(screen.getByText('Alice joined the channel')).toBeInTheDocument();
  });

  it('renders with role="log"', () => {
    render(
      <Dark>
        <SystemMessageRenderer content="System message" />
      </Dark>,
    );
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('renders timestamp when provided', () => {
    render(
      <Dark>
        <SystemMessageRenderer content="Alice joined" timestamp="2:34 PM" />
      </Dark>,
    );
    expect(screen.getByText('2:34 PM')).toBeInTheDocument();
  });

  it('does not render timestamp when not provided', () => {
    render(
      <Dark>
        <SystemMessageRenderer content="Alice joined" />
      </Dark>,
    );
    expect(screen.queryByText('2:34 PM')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

describe('SystemMessageRenderer — types', () => {
  it('renders join message', () => {
    render(
      <Dark>
        <SystemMessageRenderer type="join" content="Alice joined" />
      </Dark>,
    );
    expect(screen.getByText('Alice joined')).toBeInTheDocument();
  });

  it('renders leave message', () => {
    render(
      <Dark>
        <SystemMessageRenderer type="leave" content="Bob left the channel" />
      </Dark>,
    );
    expect(screen.getByText('Bob left the channel')).toBeInTheDocument();
  });

  it('renders pin message', () => {
    render(
      <Dark>
        <SystemMessageRenderer type="pin" content="Charlie pinned a message" />
      </Dark>,
    );
    expect(screen.getByText('Charlie pinned a message')).toBeInTheDocument();
  });

  it('renders channel_update message', () => {
    render(
      <Dark>
        <SystemMessageRenderer type="channel_update" content="Channel name changed to #general" />
      </Dark>,
    );
    expect(screen.getByText('Channel name changed to #general')).toBeInTheDocument();
  });

  it('renders role_update message', () => {
    render(
      <Dark>
        <SystemMessageRenderer type="role_update" content="Dave was promoted to admin" />
      </Dark>,
    );
    expect(screen.getByText('Dave was promoted to admin')).toBeInTheDocument();
  });

  it('renders generic message', () => {
    render(
      <Dark>
        <SystemMessageRenderer type="generic" content="Something happened" />
      </Dark>,
    );
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Custom icon
// ---------------------------------------------------------------------------

describe('SystemMessageRenderer — custom icon', () => {
  it('renders custom icon instead of default', () => {
    render(
      <Dark>
        <SystemMessageRenderer
          content="Custom event"
          icon={<span data-testid="custom-icon">*</span>}
        />
      </Dark>,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Divider lines
// ---------------------------------------------------------------------------

describe('SystemMessageRenderer — layout', () => {
  it('renders two separator dividers (lines)', () => {
    const { container } = render(
      <Dark>
        <SystemMessageRenderer content="test" />
      </Dark>,
    );
    // The root div has 3 direct children: line, content, line
    const root = container.firstElementChild;
    expect(root?.children.length).toBe(3);
  });
});
