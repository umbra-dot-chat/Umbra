/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { MemberList } from './MemberList';
import type { MemberListSection } from '@coexist/wisp-core/types/MemberList.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseSections: MemberListSection[] = [
  {
    id: 'online',
    label: 'Online',
    members: [
      { id: 'u1', name: 'Alice', status: 'online', roleText: 'Admin' },
      { id: 'u2', name: 'Bob', status: 'online' },
    ],
  },
  {
    id: 'offline',
    label: 'Offline',
    members: [
      { id: 'u3', name: 'Charlie', status: 'offline' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('MemberList — rendering', () => {
  it('renders the title', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    expect(screen.getByText('Members')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} title="People" />
      </Dark>,
    );
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('renders section headers with member counts', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    expect(screen.getByText('Online (2)')).toBeInTheDocument();
    expect(screen.getByText('Offline (1)')).toBeInTheDocument();
  });

  it('renders member names', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders role text for members that have it', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('MemberList — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MemberList ref={ref} sections={baseSections} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('MemberList — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <MemberList sections={baseSections} className="custom-members" />
      </Dark>,
    );
    expect(container.querySelector('.custom-members')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('MemberList — style merge', () => {
  it('merges user style onto the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <MemberList ref={ref} sections={baseSections} style={{ marginTop: 20 }} />
      </Dark>,
    );
    expect(ref.current!.style.marginTop).toBe('20px');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('MemberList — accessibility', () => {
  it('has role="complementary" on the root element', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('has aria-label from the title', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} title="Members" />
      </Dark>,
    );
    expect(screen.getByLabelText('Members')).toBeInTheDocument();
  });

  it('renders section groups with aria-label', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    expect(screen.getByRole('group', { name: 'Online' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Offline' })).toBeInTheDocument();
  });

  it('section toggle has aria-expanded attribute', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    const toggleBtn = screen.getByText('Online (2)').closest('button')!;
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
  });
});

// ---------------------------------------------------------------------------
// Collapsible toggle
// ---------------------------------------------------------------------------

describe('MemberList — collapsible sections', () => {
  it('collapses a section when the section header is clicked', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    // Members should be visible initially
    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Click to collapse
    const sectionBtn = screen.getByText('Online (2)').closest('button')!;
    fireEvent.click(sectionBtn);

    // Members should be hidden
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('expands a collapsed section on click', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    const sectionBtn = screen.getByText('Online (2)').closest('button')!;
    // Collapse
    fireEvent.click(sectionBtn);
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    // Expand
    fireEvent.click(sectionBtn);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('respects initially collapsed sections', () => {
    const sections: MemberListSection[] = [
      {
        id: 'online',
        label: 'Online',
        members: [{ id: 'u1', name: 'Alice', status: 'online' }],
        collapsed: true,
      },
    ];
    render(
      <Dark>
        <MemberList sections={sections} />
      </Dark>,
    );
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Member click
// ---------------------------------------------------------------------------

describe('MemberList — member click', () => {
  it('fires onMemberClick with the member object', () => {
    const onMemberClick = vi.fn();
    render(
      <Dark>
        <MemberList sections={baseSections} onMemberClick={onMemberClick} />
      </Dark>,
    );
    const memberBtn = screen.getByLabelText('Alice, online');
    fireEvent.click(memberBtn);
    expect(onMemberClick).toHaveBeenCalledTimes(1);
    expect(onMemberClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', name: 'Alice' }),
    );
  });
});

// ---------------------------------------------------------------------------
// Status dots
// ---------------------------------------------------------------------------

describe('MemberList — status dots', () => {
  it('renders status dots for members with status', () => {
    const { container } = render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    // Status dots are rendered as divs with position absolute
    // We verify that member buttons exist with status in aria-label
    expect(screen.getByLabelText('Alice, online')).toBeInTheDocument();
    expect(screen.getByLabelText('Charlie, offline')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Role color
// ---------------------------------------------------------------------------

describe('MemberList — role color', () => {
  it('applies roleColor to member name when provided', () => {
    const sections: MemberListSection[] = [
      {
        id: 'admins',
        label: 'Admins',
        members: [
          { id: 'u1', name: 'Alice', status: 'online', roleColor: '#e74c3c' },
        ],
      },
    ];
    render(
      <Dark>
        <MemberList sections={sections} />
      </Dark>,
    );
    const nameEl = screen.getByText('Alice');
    expect(nameEl).toHaveStyle({ color: '#e74c3c' });
  });

  it('uses default theme color when roleColor is not provided', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    const nameEl = screen.getByText('Alice');
    // Should NOT have a custom role color
    expect(nameEl.style.color).not.toBe('rgb(231, 76, 60)');
  });
});

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

describe('MemberList — close button', () => {
  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <MemberList sections={baseSections} onClose={onClose} />
      </Dark>,
    );
    const closeBtn = screen.getByLabelText('Close member list');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is not provided', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} />
      </Dark>,
    );
    expect(screen.queryByLabelText('Close member list')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('MemberList — loading state', () => {
  it('shows loading text when loading is true', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} loading />
      </Dark>,
    );
    expect(screen.getByText(/Loading members/)).toBeInTheDocument();
  });

  it('does not render members while loading', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} loading />
      </Dark>,
    );
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton state
// ---------------------------------------------------------------------------

describe('MemberList — skeleton state', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = render(
      <Dark>
        <MemberList sections={baseSections} skeleton />
      </Dark>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBeTruthy();
  });

  it('does not render member names in skeleton state', () => {
    render(
      <Dark>
        <MemberList sections={baseSections} skeleton />
      </Dark>,
    );
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});
