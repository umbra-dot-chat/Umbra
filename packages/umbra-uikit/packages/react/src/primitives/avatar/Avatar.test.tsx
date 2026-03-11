/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar } from './Avatar';
import { avatarSizes, avatarShapes, avatarStatuses } from '@coexist/wisp-core/types/Avatar.types';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

const Light = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="light">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Avatar — rendering', () => {
  it('renders with name as initials', () => {
    render(<Dark><Avatar name="Ada Lovelace" /></Dark>);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('renders single initial for single-word name', () => {
    render(<Dark><Avatar name="Grace" /></Dark>);
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('renders with role="img"', () => {
    render(<Dark><Avatar name="Ada Lovelace" /></Dark>);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('uses alt as aria-label when provided', () => {
    render(<Dark><Avatar name="Ada" alt="Profile picture" /></Dark>);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Profile picture');
  });

  it('uses name as aria-label when no alt', () => {
    render(<Dark><Avatar name="Ada Lovelace" /></Dark>);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Ada Lovelace');
  });

  it('falls back to "Avatar" aria-label when no alt or name', () => {
    render(<Dark><Avatar /></Dark>);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Avatar');
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('Avatar — sizes', () => {
  avatarSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      render(<Dark><Avatar name="Test" size={size} /></Dark>);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

describe('Avatar — shapes', () => {
  avatarShapes.forEach((shape) => {
    it(`renders shape="${shape}" without crashing`, () => {
      render(<Dark><Avatar name="Test" shape={shape} /></Dark>);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

describe('Avatar — status', () => {
  it('renders a status dot when status is provided', () => {
    const { container } = render(<Dark><Avatar name="Ada" status="online" /></Dark>);
    const avatarEl = screen.getByRole('img');
    const statusDot = avatarEl.querySelector('span[aria-hidden]');
    expect(statusDot).toBeTruthy();
  });

  it('does not render a status dot when no status', () => {
    const { container } = render(<Dark><Avatar name="Ada" /></Dark>);
    const avatarEl = screen.getByRole('img');
    const statusDot = avatarEl.querySelector('span[aria-hidden]');
    expect(statusDot).toBeNull();
  });

  avatarStatuses.forEach((status) => {
    it(`renders status="${status}" without crashing`, () => {
      render(<Dark><Avatar name="Test" status={status} /></Dark>);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

describe('Avatar — fallback', () => {
  it('shows initials when no src is provided', () => {
    render(<Dark><Avatar name="Ada Lovelace" /></Dark>);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('shows fallback icon when no name and no src', () => {
    const MockIcon = ({ size, color, strokeWidth }: { size?: number | string; color?: string; strokeWidth?: number }) => (
      <svg data-testid="fallback-icon" width={size} height={size} />
    );
    render(<Dark><Avatar fallbackIcon={MockIcon} /></Dark>);
    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('Avatar — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    render(<Dark><Avatar skeleton /></Dark>);
    const el = screen.getByTestId('avatar-skeleton');
    expect(el).toHaveAttribute('aria-hidden');
  });

  it('renders skeleton with data-testid', () => {
    render(<Dark><Avatar skeleton /></Dark>);
    expect(screen.getByTestId('avatar-skeleton')).toBeInTheDocument();
  });

  it('does not render content when skeleton', () => {
    render(<Dark><Avatar skeleton name="Ada Lovelace" /></Dark>);
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('Avatar — className', () => {
  it('passes className through to the container', () => {
    render(<Dark><Avatar name="Ada" className="custom-avatar" /></Dark>);
    expect(screen.getByRole('img')).toHaveClass('custom-avatar');
  });
});
