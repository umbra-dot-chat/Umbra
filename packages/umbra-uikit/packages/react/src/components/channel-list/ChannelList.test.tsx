/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { ChannelList } from './ChannelList';
import type { ChannelCategory } from '@coexist/wisp-core/types/ChannelList.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseCategories: ChannelCategory[] = [
  {
    id: 'text',
    label: 'TEXT CHANNELS',
    channels: [
      { id: 'ch1', name: 'general', type: 'text' },
      { id: 'ch2', name: 'random', type: 'text', unreadCount: 5 },
      { id: 'ch3', name: 'announcements', type: 'announcement' },
    ],
  },
  {
    id: 'voice',
    label: 'VOICE CHANNELS',
    channels: [
      { id: 'ch4', name: 'Lounge', type: 'voice' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ChannelList — rendering', () => {
  it('renders category labels', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    expect(screen.getByText('TEXT CHANNELS')).toBeInTheDocument();
    expect(screen.getByText('VOICE CHANNELS')).toBeInTheDocument();
  });

  it('renders channel names', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('random')).toBeInTheDocument();
    expect(screen.getByText('announcements')).toBeInTheDocument();
    expect(screen.getByText('Lounge')).toBeInTheDocument();
  });

  it('renders a header slot when provided', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} header={<span>My Server</span>} />
      </Dark>,
    );
    expect(screen.getByText('My Server')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('ChannelList — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ChannelList ref={ref} categories={baseCategories} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('ChannelList — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <ChannelList categories={baseCategories} className="custom-channels" />
      </Dark>,
    );
    expect(container.querySelector('.custom-channels')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('ChannelList — style merge', () => {
  it('merges user style onto the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <ChannelList ref={ref} categories={baseCategories} style={{ marginTop: 15 }} />
      </Dark>,
    );
    expect(ref.current!.style.marginTop).toBe('15px');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('ChannelList — accessibility', () => {
  it('has role="navigation" on the root element', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('has aria-label "Channel list"', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    expect(screen.getByLabelText('Channel list')).toBeInTheDocument();
  });

  it('renders category groups with aria-label', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    expect(screen.getByRole('group', { name: 'TEXT CHANNELS' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'VOICE CHANNELS' })).toBeInTheDocument();
  });

  it('category toggle has aria-expanded attribute', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    const toggleBtn = screen.getByText('TEXT CHANNELS').closest('button')!;
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
  });
});

// ---------------------------------------------------------------------------
// Collapse toggle
// ---------------------------------------------------------------------------

describe('ChannelList — collapse toggle', () => {
  it('collapses a category when the header is clicked', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    expect(screen.getByText('general')).toBeInTheDocument();

    const catBtn = screen.getByText('TEXT CHANNELS').closest('button')!;
    fireEvent.click(catBtn);

    expect(screen.queryByText('general')).not.toBeInTheDocument();
    expect(screen.queryByText('random')).not.toBeInTheDocument();
  });

  it('expands a collapsed category on click', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    const catBtn = screen.getByText('TEXT CHANNELS').closest('button')!;
    fireEvent.click(catBtn);
    expect(screen.queryByText('general')).not.toBeInTheDocument();
    fireEvent.click(catBtn);
    expect(screen.getByText('general')).toBeInTheDocument();
  });

  it('fires onCategoryToggle when a category is toggled', () => {
    const onCategoryToggle = vi.fn();
    render(
      <Dark>
        <ChannelList
          categories={baseCategories}
          onCategoryToggle={onCategoryToggle}
        />
      </Dark>,
    );
    const catBtn = screen.getByText('TEXT CHANNELS').closest('button')!;
    fireEvent.click(catBtn);
    expect(onCategoryToggle).toHaveBeenCalledWith('text');
  });

  it('respects initially collapsed categories', () => {
    const collapsedCategories: ChannelCategory[] = [
      {
        id: 'text',
        label: 'TEXT CHANNELS',
        channels: [{ id: 'ch1', name: 'general', type: 'text' }],
        collapsed: true,
      },
    ];
    render(
      <Dark>
        <ChannelList categories={collapsedCategories} />
      </Dark>,
    );
    expect(screen.queryByText('general')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Channel click
// ---------------------------------------------------------------------------

describe('ChannelList — channel click', () => {
  it('fires onChannelClick with the channel object', () => {
    const onChannelClick = vi.fn();
    render(
      <Dark>
        <ChannelList categories={baseCategories} onChannelClick={onChannelClick} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('general'));
    expect(onChannelClick).toHaveBeenCalledTimes(1);
    expect(onChannelClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ch1', name: 'general' }),
    );
  });

  it('responds to keyboard Enter on a channel item', () => {
    const onChannelClick = vi.fn();
    render(
      <Dark>
        <ChannelList categories={baseCategories} onChannelClick={onChannelClick} />
      </Dark>,
    );
    const channelItem = screen.getByText('general').closest('[role="button"]')!;
    fireEvent.keyDown(channelItem, { key: 'Enter' });
    expect(onChannelClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Unread badge
// ---------------------------------------------------------------------------

describe('ChannelList — unread badge', () => {
  it('renders unread count badge for channels with unreadCount', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} />
      </Dark>,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders mention badge with @ prefix when hasMention is true', () => {
    const categories: ChannelCategory[] = [
      {
        id: 'text',
        label: 'TEXT',
        channels: [
          { id: 'ch1', name: 'general', unreadCount: 3, hasMention: true },
        ],
      },
    ];
    render(
      <Dark>
        <ChannelList categories={categories} />
      </Dark>,
    );
    expect(screen.getByText('@3')).toBeInTheDocument();
  });

  it('does not render badge for muted channels even with unread count', () => {
    const categories: ChannelCategory[] = [
      {
        id: 'text',
        label: 'TEXT',
        channels: [
          { id: 'ch1', name: 'general', unreadCount: 7, muted: true },
        ],
      },
    ];
    render(
      <Dark>
        <ChannelList categories={categories} />
      </Dark>,
    );
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('does not render badge when unreadCount is 0', () => {
    const categories: ChannelCategory[] = [
      {
        id: 'text',
        label: 'TEXT',
        channels: [
          { id: 'ch1', name: 'general', unreadCount: 0 },
        ],
      },
    ];
    render(
      <Dark>
        <ChannelList categories={categories} />
      </Dark>,
    );
    // No badge elements besides channel text
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Active state
// ---------------------------------------------------------------------------

describe('ChannelList — active state', () => {
  it('renders active channel without crashing', () => {
    const categories: ChannelCategory[] = [
      {
        id: 'text',
        label: 'TEXT',
        channels: [{ id: 'ch1', name: 'general', active: true }],
      },
    ];
    render(
      <Dark>
        <ChannelList categories={categories} />
      </Dark>,
    );
    expect(screen.getByText('general')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Channel type icons
// ---------------------------------------------------------------------------

describe('ChannelList — channel type icons', () => {
  it('renders SVG icons for different channel types', () => {
    const categories: ChannelCategory[] = [
      {
        id: 'mixed',
        label: 'Mixed',
        channels: [
          { id: 'c1', name: 'text-ch', type: 'text' },
          { id: 'c2', name: 'voice-ch', type: 'voice' },
          { id: 'c3', name: 'announce-ch', type: 'announcement' },
          { id: 'c4', name: 'thread-ch', type: 'thread' },
          { id: 'c5', name: 'forum-ch', type: 'forum' },
        ],
      },
    ];
    const { container } = render(
      <Dark>
        <ChannelList categories={categories} />
      </Dark>,
    );
    // Each channel should have an SVG icon
    const svgs = container.querySelectorAll('svg');
    // At least 5 channel icons + 1 chevron for the category header
    expect(svgs.length).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('ChannelList — loading state', () => {
  it('shows loading text when loading is true', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} loading />
      </Dark>,
    );
    expect(screen.getByText('Loading channels...')).toBeInTheDocument();
  });

  it('does not render channels while loading', () => {
    render(
      <Dark>
        <ChannelList categories={baseCategories} loading />
      </Dark>,
    );
    expect(screen.queryByText('general')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton state
// ---------------------------------------------------------------------------

describe('ChannelList — skeleton state', () => {
  it('renders skeleton items when skeleton is true', () => {
    const { container } = render(
      <Dark>
        <ChannelList categories={baseCategories} skeleton />
      </Dark>,
    );
    // Skeleton renders placeholder divs, no real channel names
    expect(screen.queryByText('general')).not.toBeInTheDocument();
    // The container should still be rendered
    expect(container.firstElementChild).toBeInTheDocument();
  });
});
