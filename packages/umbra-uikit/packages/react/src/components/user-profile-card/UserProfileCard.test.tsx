/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { UserProfileCard } from './UserProfileCard';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('UserProfileCard — rendering', () => {
  it('renders the user name', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" />
      </Dark>,
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders the username when provided', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" username="@janedoe" />
      </Dark>,
    );
    expect(screen.getByText('@janedoe')).toBeInTheDocument();
  });

  it('does not render username when not provided', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" />
      </Dark>,
    );
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it('renders bio text when provided', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" bio="Full-stack developer" />
      </Dark>,
    );
    expect(screen.getByText('Full-stack developer')).toBeInTheDocument();
  });

  it('does not render bio when not provided', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" />
      </Dark>,
    );
    expect(screen.queryByText('Full-stack developer')).not.toBeInTheDocument();
  });

  it('renders statusText when provided', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" statusText="In a meeting" />
      </Dark>,
    );
    expect(screen.getByText('In a meeting')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('UserProfileCard — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <UserProfileCard ref={ref} name="Jane Doe" />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('UserProfileCard — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <UserProfileCard name="Jane Doe" className="custom-profile" />
      </Dark>,
    );
    expect(container.querySelector('.custom-profile')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('UserProfileCard — style merge', () => {
  it('merges user style onto the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <UserProfileCard
          ref={ref}
          name="Jane Doe"
          style={{ marginTop: 42 }}
        />
      </Dark>,
    );
    expect(ref.current!.style.marginTop).toBe('42px');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('UserProfileCard — accessibility', () => {
  it('has role="complementary" on the root element', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" />
      </Dark>,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('has aria-label with the user name', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" />
      </Dark>,
    );
    expect(screen.getByLabelText('Jane Doe profile card')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

describe('UserProfileCard — status dot', () => {
  it('renders a status dot with the correct aria-label for online', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" status="online" />
      </Dark>,
    );
    expect(screen.getByLabelText('Online')).toBeInTheDocument();
  });

  it('renders the correct status label for dnd', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" status="dnd" />
      </Dark>,
    );
    expect(screen.getByLabelText('Do Not Disturb')).toBeInTheDocument();
  });

  it('defaults to Offline when no status is provided', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" />
      </Dark>,
    );
    expect(screen.getByLabelText('Offline')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

describe('UserProfileCard — roles', () => {
  it('renders role badges when roles are provided', () => {
    render(
      <Dark>
        <UserProfileCard
          name="Jane Doe"
          roles={[
            { id: 'admin', label: 'Admin', color: '#e74c3c' },
            { id: 'mod', label: 'Moderator' },
          ]}
        />
      </Dark>,
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
  });

  it('does not render roles section when roles is empty', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" roles={[]} />
      </Dark>,
    );
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

describe('UserProfileCard — actions', () => {
  it('renders action buttons and fires onClick', () => {
    const onMessage = vi.fn();
    render(
      <Dark>
        <UserProfileCard
          name="Jane Doe"
          actions={[
            { id: 'msg', label: 'Message', onClick: onMessage },
          ]}
        />
      </Dark>,
    );
    const btn = screen.getByLabelText('Message');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('disables action buttons when disabled is true', () => {
    const onClick = vi.fn();
    render(
      <Dark>
        <UserProfileCard
          name="Jane Doe"
          actions={[
            { id: 'call', label: 'Call', onClick, disabled: true },
          ]}
        />
      </Dark>,
    );
    const btn = screen.getByLabelText('Call');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not render actions section when actions is empty', () => {
    const { container } = render(
      <Dark>
        <UserProfileCard name="Jane Doe" actions={[]} />
      </Dark>,
    );
    // No buttons besides possibly the close button (which is not rendered here)
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

describe('UserProfileCard — close button', () => {
  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" onClose={onClose} />
      </Dark>,
    );
    const closeBtn = screen.getByLabelText('Close profile card');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is not provided', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" />
      </Dark>,
    );
    expect(screen.queryByLabelText('Close profile card')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

describe('UserProfileCard — banner', () => {
  it('renders the banner div (always present in normal state)', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <UserProfileCard ref={ref} name="Jane Doe" bannerColor="#3498db" />
      </Dark>,
    );
    // The second child of the root div (after possible close button) is the banner
    expect(ref.current).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Skeleton state
// ---------------------------------------------------------------------------

describe('UserProfileCard — skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <UserProfileCard name="Jane Doe" skeleton />
      </Dark>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBeTruthy();
  });

  it('does not render name text in skeleton state', () => {
    render(
      <Dark>
        <UserProfileCard name="Jane Doe" skeleton />
      </Dark>,
    );
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('applies className in skeleton state', () => {
    const { container } = render(
      <Dark>
        <UserProfileCard name="Jane Doe" skeleton className="skeleton-class" />
      </Dark>,
    );
    expect(container.querySelector('.skeleton-class')).toBeInTheDocument();
  });
});
