/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { InviteManager } from './InviteManager';
import type { InviteLink } from '@coexist/wisp-core/types/InviteManager.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const futureDate = new Date(Date.now() + 86400000).toISOString(); // +1 day
const pastDate = new Date(Date.now() - 86400000).toISOString(); // -1 day

const baseInvites: InviteLink[] = [
  {
    id: 'inv-1',
    code: 'abc123',
    createdBy: 'Alice',
    createdAt: '2025-01-01T00:00:00Z',
    expiresAt: futureDate,
    maxUses: 10,
    uses: 3,
  },
  {
    id: 'inv-2',
    code: 'xyz789',
    createdBy: 'Bob',
    createdAt: '2025-01-02T00:00:00Z',
    expiresAt: null,
    maxUses: null,
    uses: 15,
  },
  {
    id: 'inv-3',
    code: 'expired1',
    createdBy: 'Charlie',
    createdAt: '2025-01-03T00:00:00Z',
    expiresAt: pastDate,
    maxUses: 5,
    uses: 5,
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('InviteManager -- rendering', () => {
  it('renders the default title', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    expect(screen.getByText('Invite People')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} title="Share Invite" />
      </Dark>,
    );
    expect(screen.getByText('Share Invite')).toBeInTheDocument();
  });

  it('renders invite codes in the list', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    // Codes should appear as part of the full URL text
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    expect(screen.getByText(/xyz789/)).toBeInTheDocument();
    expect(screen.getByText(/expired1/)).toBeInTheDocument();
  });

  it('renders creator names', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it('renders empty state when no invites', () => {
    render(
      <Dark>
        <InviteManager invites={[]} />
      </Dark>,
    );
    expect(screen.getByText(/No active invite links/)).toBeInTheDocument();
  });

  it('renders uses information', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    // inv-1: 3 / 10 uses
    expect(screen.getByText(/3 \/ 10 uses/)).toBeInTheDocument();
    // inv-2: 15 uses (no limit)
    expect(screen.getByText(/15 uses/)).toBeInTheDocument();
  });

  it('shows expired badge for expired invites', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows "Never" for invites without expiry', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    expect(screen.getByText('Never')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Create invite
// ---------------------------------------------------------------------------

describe('InviteManager -- create invite', () => {
  it('renders create section when onCreateInvite is provided', () => {
    const onCreateInvite = vi.fn();
    render(
      <Dark>
        <InviteManager invites={[]} onCreateInvite={onCreateInvite} />
      </Dark>,
    );
    // Create button should be rendered
    expect(screen.getByText('Create Invite')).toBeInTheDocument();
  });

  it('does not render create section when onCreateInvite is not provided', () => {
    render(
      <Dark>
        <InviteManager invites={[]} />
      </Dark>,
    );
    expect(screen.queryByText('Create Invite')).not.toBeInTheDocument();
  });

  it('calls onCreateInvite with default options on button click', () => {
    const onCreateInvite = vi.fn();
    render(
      <Dark>
        <InviteManager invites={[]} onCreateInvite={onCreateInvite} />
      </Dark>,
    );
    const createBtn = screen.getByText('Create Invite');
    fireEvent.click(createBtn);
    expect(onCreateInvite).toHaveBeenCalledTimes(1);
    expect(onCreateInvite).toHaveBeenCalledWith(
      expect.objectContaining({ expiresIn: 86400, maxUses: 0 }),
    );
  });

  it('shows "Creating..." text when creating is true', () => {
    const onCreateInvite = vi.fn();
    render(
      <Dark>
        <InviteManager invites={[]} onCreateInvite={onCreateInvite} creating />
      </Dark>,
    );
    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });

  it('disables the create button when creating', () => {
    const onCreateInvite = vi.fn();
    render(
      <Dark>
        <InviteManager invites={[]} onCreateInvite={onCreateInvite} creating />
      </Dark>,
    );
    // The Button should be disabled
    const createBtn = screen.getByText('Creating...').closest('button');
    expect(createBtn).toBeDisabled();
  });

  it('renders the Expires and Max uses select labels', () => {
    const onCreateInvite = vi.fn();
    render(
      <Dark>
        <InviteManager invites={[]} onCreateInvite={onCreateInvite} />
      </Dark>,
    );
    expect(screen.getByText('Expires')).toBeInTheDocument();
    expect(screen.getByText('Max uses')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Delete invite
// ---------------------------------------------------------------------------

describe('InviteManager -- delete invite', () => {
  it('calls onDeleteInvite with the invite id', () => {
    const onDeleteInvite = vi.fn();
    render(
      <Dark>
        <InviteManager invites={baseInvites} onDeleteInvite={onDeleteInvite} />
      </Dark>,
    );
    const deleteBtn = screen.getByLabelText('Delete invite abc123');
    fireEvent.click(deleteBtn);
    expect(onDeleteInvite).toHaveBeenCalledTimes(1);
    expect(onDeleteInvite).toHaveBeenCalledWith('inv-1');
  });

  it('does not render delete buttons when onDeleteInvite is not provided', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    expect(screen.queryByLabelText('Delete invite abc123')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Copy invite
// ---------------------------------------------------------------------------

describe('InviteManager -- copy invite', () => {
  it('calls onCopy with the full invite URL', () => {
    const onCopy = vi.fn();
    render(
      <Dark>
        <InviteManager invites={baseInvites} onCopy={onCopy} />
      </Dark>,
    );
    const copyBtn = screen.getByLabelText('Copy invite abc123');
    fireEvent.click(copyBtn);
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith('https://umbra.app/invite/abc123');
  });

  it('uses custom baseUrl for the copy', () => {
    const onCopy = vi.fn();
    render(
      <Dark>
        <InviteManager
          invites={baseInvites}
          onCopy={onCopy}
          baseUrl="https://my.app/join/"
        />
      </Dark>,
    );
    const copyBtn = screen.getByLabelText('Copy invite abc123');
    fireEvent.click(copyBtn);
    expect(onCopy).toHaveBeenCalledWith('https://my.app/join/abc123');
  });

  it('does not render copy buttons when onCopy is not provided', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    expect(screen.queryByLabelText('Copy invite abc123')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

describe('InviteManager -- close button', () => {
  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <InviteManager invites={baseInvites} onClose={onClose} />
      </Dark>,
    );
    const closeBtn = screen.getByLabelText('Close invite manager');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is not provided', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    expect(screen.queryByLabelText('Close invite manager')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('InviteManager -- ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <InviteManager ref={ref} invites={baseInvites} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('InviteManager -- className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <InviteManager invites={baseInvites} className="custom-invites" />
      </Dark>,
    );
    expect(container.querySelector('.custom-invites')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('InviteManager -- style merge', () => {
  it('merges user style onto the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <InviteManager ref={ref} invites={baseInvites} style={{ marginTop: 20 }} />
      </Dark>,
    );
    expect(ref.current!.style.marginTop).toBe('20px');
  });
});

// ---------------------------------------------------------------------------
// Skeleton state
// ---------------------------------------------------------------------------

describe('InviteManager -- skeleton state', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <InviteManager invites={baseInvites} skeleton />
      </Dark>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBeTruthy();
  });

  it('does not render invite codes in skeleton state', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} skeleton />
      </Dark>,
    );
    expect(screen.queryByText(/abc123/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('InviteManager -- accessibility', () => {
  it('has role="region" on the root element', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} />
      </Dark>,
    );
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('has aria-label from the title', () => {
    render(
      <Dark>
        <InviteManager invites={baseInvites} title="Invite People" />
      </Dark>,
    );
    expect(screen.getByLabelText('Invite People')).toBeInTheDocument();
  });
});
