/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { CommunitySidebar } from './CommunitySidebar';
import type { CommunitySpace, CommunityInfo } from '@coexist/wisp-core/types/CommunitySidebar.types';
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

const community: CommunityInfo = {
  name: 'Umbra',
  subtitle: '128 members',
};

const spaces: CommunitySpace[] = [
  { id: 'general', name: 'General' },
  { id: 'dev', name: 'Development', unreadCount: 5 },
  { id: 'social', name: 'Social' },
];

const categories: ChannelCategory[] = [
  {
    id: 'text',
    label: 'TEXT CHANNELS',
    channels: [
      { id: 'ch1', name: 'welcome', type: 'welcome' },
      { id: 'ch2', name: 'general', type: 'text', active: true },
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

describe('CommunitySidebar — rendering', () => {
  it('renders the community name', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.getByText('Umbra')).toBeInTheDocument();
  });

  it('renders the community subtitle', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.getByText('128 members')).toBeInTheDocument();
  });

  it('renders space tabs', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.getByRole('tab', { name: /General/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Development/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Social/ })).toBeInTheDocument();
  });

  it('marks the active space tab as selected', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="dev"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.getByRole('tab', { name: /Development/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /General/ })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('renders channel categories from ChannelList', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.getByText('TEXT CHANNELS')).toBeInTheDocument();
    expect(screen.getByText('VOICE CHANNELS')).toBeInTheDocument();
  });

  it('renders channel names from ChannelList', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.getByText('welcome')).toBeInTheDocument();
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('announcements')).toBeInTheDocument();
    expect(screen.getByText('Lounge')).toBeInTheDocument();
  });

  it('hides space tabs when only one space exists', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={[{ id: 'general', name: 'General' }]}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('shows unread badge on space tab', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('CommunitySidebar — interactions', () => {
  it('calls onSpaceChange when a space tab is clicked', () => {
    const onSpaceChange = vi.fn();
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          onSpaceChange={onSpaceChange}
          categories={categories}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByRole('tab', { name: /Development/ }));
    expect(onSpaceChange).toHaveBeenCalledWith('dev');
  });

  it('calls onCommunityClick when the header is clicked', () => {
    const onCommunityClick = vi.fn();
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          onCommunityClick={onCommunityClick}
          categories={categories}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Umbra'));
    expect(onCommunityClick).toHaveBeenCalledTimes(1);
  });

  it('calls onChannelClick when a channel is clicked', () => {
    const onChannelClick = vi.fn();
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          onChannelClick={onChannelClick}
          categories={categories}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Lounge'));
    expect(onChannelClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ch4', name: 'Lounge' }),
    );
  });
});

// ---------------------------------------------------------------------------
// Skeleton / loading
// ---------------------------------------------------------------------------

describe('CommunitySidebar — states', () => {
  it('renders skeleton state', () => {
    const { container } = render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
          skeleton
        />
      </Dark>,
    );
    // Skeleton should not render community name
    expect(screen.queryByText('Umbra')).not.toBeInTheDocument();
    // But should render something
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with custom icon in header', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={{ ...community, icon: <span data-testid="icon">🏰</span> }}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('CommunitySidebar — accessibility', () => {
  it('has navigation role with community name label', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(
      screen.getByRole('navigation', { name: /Umbra community navigation/i }),
    ).toBeInTheDocument();
  });

  it('has tablist role on space tabs', () => {
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
        />
      </Dark>,
    );
    expect(
      screen.getByRole('tablist', { name: /Community spaces/i }),
    ).toBeInTheDocument();
  });

  it('supports keyboard navigation on community header', () => {
    const onCommunityClick = vi.fn();
    render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          onCommunityClick={onCommunityClick}
          categories={categories}
        />
      </Dark>,
    );
    const header = screen.getByText('Umbra').closest('[role="button"]')!;
    fireEvent.keyDown(header, { key: 'Enter' });
    expect(onCommunityClick).toHaveBeenCalledTimes(1);
  });

  it('merges user-provided styles', () => {
    const { container } = render(
      <Dark>
        <CommunitySidebar
          community={community}
          spaces={spaces}
          activeSpaceId="general"
          categories={categories}
          style={{ maxWidth: 300 }}
        />
      </Dark>,
    );
    expect(container.firstChild).toHaveStyle('max-width: 300px');
  });
});
