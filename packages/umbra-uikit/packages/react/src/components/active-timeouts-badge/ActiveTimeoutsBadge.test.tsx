/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActiveTimeoutsBadge } from './ActiveTimeoutsBadge';
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

function renderBadge(props: Record<string, unknown> = {}) {
  const defaultProps = { active: true };
  return render(
    <Dark>
      <ActiveTimeoutsBadge {...defaultProps} {...props} />
    </Dark>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ActiveTimeoutsBadge -- rendering', () => {
  it('renders when active=true', () => {
    renderBadge();
    expect(screen.getByText('Muted')).toBeInTheDocument();
  });

  it('does not render when active=false', () => {
    renderBadge({ active: false });
    expect(screen.queryByText('Muted')).not.toBeInTheDocument();
  });

  it('renders "Restricted" for type=restrict', () => {
    renderBadge({ type: 'restrict' });
    expect(screen.getByText('Restricted')).toBeInTheDocument();
  });

  it('renders "Muted" for type=mute', () => {
    renderBadge({ type: 'mute' });
    expect(screen.getByText('Muted')).toBeInTheDocument();
  });

  it('has role=status', () => {
    renderBadge();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('ActiveTimeoutsBadge -- accessibility', () => {
  it('includes expiry in aria-label when provided', () => {
    renderBadge({ expiresAt: '2025-02-01' });
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('2025-02-01'),
    );
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('ActiveTimeoutsBadge -- sizes', () => {
  it.each(['xs', 'sm', 'md'] as const)('renders at size=%s without crashing', (size) => {
    renderBadge({ size });
    expect(screen.getByText('Muted')).toBeInTheDocument();
  });
});
