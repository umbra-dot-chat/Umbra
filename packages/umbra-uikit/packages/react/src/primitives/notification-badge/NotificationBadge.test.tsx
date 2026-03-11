/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationBadge } from './NotificationBadge';
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

describe('NotificationBadge — rendering', () => {
  it('renders children', () => {
    render(
      <Dark>
        <NotificationBadge count={3}>
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('renders count text', () => {
    render(
      <Dark>
        <NotificationBadge count={5}>
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Overflow
// ---------------------------------------------------------------------------

describe('NotificationBadge — overflow', () => {
  it('shows max+ when count exceeds max', () => {
    render(
      <Dark>
        <NotificationBadge count={150} max={99}>
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('shows exact count when within max', () => {
    render(
      <Dark>
        <NotificationBadge count={50} max={99}>
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Dot mode
// ---------------------------------------------------------------------------

describe('NotificationBadge — dot mode', () => {
  it('renders dot badge without count text', () => {
    const { container } = render(
      <Dark>
        <NotificationBadge dot>
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    const badge = container.querySelector('[aria-hidden="true"]');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Invisible
// ---------------------------------------------------------------------------

describe('NotificationBadge — invisible', () => {
  it('does not show badge when invisible is true', () => {
    const { container } = render(
      <Dark>
        <NotificationBadge count={5} invisible>
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    const badge = container.querySelector('[aria-hidden="true"]');
    expect(badge).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Zero count
// ---------------------------------------------------------------------------

describe('NotificationBadge — zero count', () => {
  it('does not show badge when count is 0', () => {
    const { container } = render(
      <Dark>
        <NotificationBadge count={0}>
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    const badge = container.querySelector('[aria-hidden="true"]');
    expect(badge).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Color variants
// ---------------------------------------------------------------------------

describe('NotificationBadge — color variants', () => {
  (['danger', 'warning', 'success', 'info', 'default'] as const).forEach((color) => {
    it(`renders color="${color}" without crashing`, () => {
      render(
        <Dark>
          <NotificationBadge count={1} color={color}>
            <span>Icon</span>
          </NotificationBadge>
        </Dark>,
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('NotificationBadge — className', () => {
  it('passes className through to the wrapper', () => {
    const { container } = render(
      <Dark>
        <NotificationBadge count={1} className="custom-badge">
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    expect(container.querySelector('.custom-badge')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('NotificationBadge — ref forwarding', () => {
  it('forwards ref to the wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <NotificationBadge ref={ref} count={1}>
          <span>Icon</span>
        </NotificationBadge>
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
