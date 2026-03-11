/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThreadFollowButton } from './ThreadFollowButton';
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

describe('ThreadFollowButton — rendering', () => {
  it('renders "Follow" label when not following', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} />
      </Dark>,
    );
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('renders "Following" label when following', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={true} />
      </Dark>,
    );
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('renders custom labels', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} followLabel="Subscribe" followingLabel="Subscribed" />
      </Dark>,
    );
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} />
      </Dark>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// aria-pressed
// ---------------------------------------------------------------------------

describe('ThreadFollowButton — aria-pressed', () => {
  it('has aria-pressed=true when following', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={true} />
      </Dark>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('has aria-pressed=false when not following', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} />
      </Dark>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });
});

// ---------------------------------------------------------------------------
// onToggle
// ---------------------------------------------------------------------------

describe('ThreadFollowButton — onToggle', () => {
  it('calls onToggle when clicked', () => {
    const handleToggle = vi.fn();
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} onToggle={handleToggle} />
      </Dark>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggle when disabled', () => {
    const handleToggle = vi.fn();
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} onToggle={handleToggle} disabled />
      </Dark>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleToggle).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('ThreadFollowButton — disabled', () => {
  it('has disabled attribute when disabled', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} disabled />
      </Dark>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Icon rendering
// ---------------------------------------------------------------------------

describe('ThreadFollowButton — icons', () => {
  it('renders Bell icon when not following', () => {
    const { container } = render(
      <Dark>
        <ThreadFollowButton isFollowing={false} />
      </Dark>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders BellOff icon when following', () => {
    const { container } = render(
      <Dark>
        <ThreadFollowButton isFollowing={true} />
      </Dark>,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // BellOff has a line element (the strikethrough)
    expect(svg!.querySelector('line')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('ThreadFollowButton — ref forwarding', () => {
  it('forwards ref to the button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Dark>
        <ThreadFollowButton ref={ref} isFollowing={false} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('ThreadFollowButton — sizes', () => {
  it('renders sm size without crashing', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} size="sm" />
      </Dark>,
    );
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('renders md size without crashing', () => {
    render(
      <Dark>
        <ThreadFollowButton isFollowing={false} size="md" />
      </Dark>,
    );
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });
});
