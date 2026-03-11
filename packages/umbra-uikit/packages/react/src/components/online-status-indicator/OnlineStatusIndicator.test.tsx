/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
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

describe('OnlineStatusIndicator -- rendering', () => {
  it('renders the indicator dot', () => {
    const { container } = render(
      <Dark>
        <OnlineStatusIndicator status="online" />
      </Dark>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('has correct aria-label for online', () => {
    render(
      <Dark>
        <OnlineStatusIndicator status="online" />
      </Dark>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Online');
  });

  it('has correct aria-label for dnd', () => {
    render(
      <Dark>
        <OnlineStatusIndicator status="dnd" />
      </Dark>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Do Not Disturb');
  });

  it('has correct aria-label for offline', () => {
    render(
      <Dark>
        <OnlineStatusIndicator status="offline" />
      </Dark>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Offline');
  });
});

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

describe('OnlineStatusIndicator -- all statuses', () => {
  (['online', 'idle', 'dnd', 'offline', 'invisible'] as const).forEach((status) => {
    it(`renders status="${status}" without crashing`, () => {
      render(
        <Dark>
          <OnlineStatusIndicator status={status} />
        </Dark>,
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('OnlineStatusIndicator -- showLabel', () => {
  it('shows label text when showLabel is true', () => {
    render(
      <Dark>
        <OnlineStatusIndicator status="online" showLabel />
      </Dark>,
    );
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows Idle label', () => {
    render(
      <Dark>
        <OnlineStatusIndicator status="idle" showLabel />
      </Dark>,
    );
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('does not show label text by default', () => {
    render(
      <Dark>
        <OnlineStatusIndicator status="online" />
      </Dark>,
    );
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('OnlineStatusIndicator -- sizes', () => {
  (['xs', 'sm', 'md', 'lg'] as const).forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(
        <Dark>
          <OnlineStatusIndicator status="online" size={size} />
        </Dark>,
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('OnlineStatusIndicator -- ref', () => {
  it('forwards ref to the wrapper div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <OnlineStatusIndicator ref={ref} status="online" />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('OnlineStatusIndicator -- className', () => {
  it('passes className through', () => {
    const { container } = render(
      <Dark>
        <OnlineStatusIndicator status="online" className="custom-indicator" />
      </Dark>,
    );
    expect(container.querySelector('.custom-indicator')).toBeInTheDocument();
  });
});
