import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CommunitySidebar } from './CommunitySidebar';
import type { CommunitySpace, CommunityInfo } from '@coexist/wisp-core/types/CommunitySidebar.types';
import type { ChannelCategory } from '@coexist/wisp-core/types/ChannelList.types';

const meta: Meta<typeof CommunitySidebar> = {
  title: 'Components/CommunitySidebar',
  component: CommunitySidebar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 240, height: 500, border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CommunitySidebar>;

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

const community: CommunityInfo = {
  name: 'Umbra Community',
  subtitle: '1,284 members',
};

const spaces: CommunitySpace[] = [
  { id: 'general', name: 'General' },
  { id: 'dev', name: 'Development', unreadCount: 12 },
  { id: 'social', name: 'Social' },
  { id: 'support', name: 'Support', unreadCount: 3 },
];

const generalCategories: ChannelCategory[] = [
  {
    id: 'info',
    label: 'INFORMATION',
    channels: [
      { id: 'welcome', name: 'welcome', type: 'welcome' },
      { id: 'rules', name: 'rules', type: 'announcement' },
      { id: 'announcements', name: 'announcements', type: 'announcement' },
    ],
  },
  {
    id: 'text',
    label: 'TEXT CHANNELS',
    channels: [
      { id: 'general', name: 'general', type: 'text', active: true },
      { id: 'random', name: 'random', type: 'text', unreadCount: 7 },
      { id: 'memes', name: 'memes', type: 'text' },
    ],
  },
  {
    id: 'voice',
    label: 'VOICE CHANNELS',
    channels: [
      { id: 'lounge', name: 'Lounge', type: 'voice' },
      { id: 'gaming', name: 'Gaming', type: 'voice' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    community,
    spaces,
    activeSpaceId: 'general',
    categories: generalCategories,
    onChannelCreate: (categoryId) => console.log('Create channel in:', categoryId),
  },
};

export const SingleSpace: Story = {
  args: {
    community: { name: 'Small Project', subtitle: '12 members' },
    spaces: [{ id: 'main', name: 'Main' }],
    activeSpaceId: 'main',
    categories: [
      {
        id: 'text',
        label: 'TEXT CHANNELS',
        channels: [
          { id: 'general', name: 'general', type: 'text', active: true },
          { id: 'random', name: 'random', type: 'text' },
        ],
      },
    ],
  },
};

export const WithIcon: Story = {
  args: {
    community: {
      name: 'Umbra Community',
      subtitle: '1,284 members',
      icon: (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          U
        </div>
      ),
    },
    spaces,
    activeSpaceId: 'general',
    categories: generalCategories,
  },
};

export const Skeleton: Story = {
  args: {
    community,
    spaces,
    activeSpaceId: 'general',
    categories: [],
    skeleton: true,
  },
};

function InteractiveDemo() {
  const [activeSpace, setActiveSpace] = useState('general');

  const categoryMap: Record<string, ChannelCategory[]> = {
    general: generalCategories,
    dev: [
      {
        id: 'dev-text',
        label: 'DEV CHANNELS',
        channels: [
          { id: 'frontend', name: 'frontend', type: 'text', active: true },
          { id: 'backend', name: 'backend', type: 'text', unreadCount: 3 },
          { id: 'design', name: 'design', type: 'text' },
        ],
      },
      {
        id: 'dev-files',
        label: 'RESOURCES',
        channels: [
          { id: 'docs', name: 'documentation', type: 'files' },
          { id: 'releases', name: 'releases', type: 'announcement' },
        ],
      },
    ],
    social: [
      {
        id: 'social-text',
        label: 'HANGOUT',
        channels: [
          { id: 'off-topic', name: 'off-topic', type: 'text', active: true },
          { id: 'gaming', name: 'gaming', type: 'text' },
        ],
      },
    ],
    support: [
      {
        id: 'support-text',
        label: 'HELP',
        channels: [
          { id: 'bugs', name: 'bug-reports', type: 'text', active: true, unreadCount: 2 },
          { id: 'questions', name: 'questions', type: 'forum' },
        ],
      },
    ],
  };

  return (
    <CommunitySidebar
      community={community}
      spaces={spaces}
      activeSpaceId={activeSpace}
      onSpaceChange={setActiveSpace}
      categories={categoryMap[activeSpace] ?? []}
      onChannelClick={(ch) => console.log('Channel clicked:', ch.name)}
      onChannelCreate={(catId) => console.log('Create channel in:', catId)}
      onCommunityClick={() => console.log('Community settings')}
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
