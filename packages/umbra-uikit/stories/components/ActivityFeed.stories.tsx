/**
 * ActivityFeed — Stories showing feed patterns.
 *
 * @module stories/activity-feed
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ActivityFeed } from '@wisp-ui/react';
import { MessageSquare, GitCommit, User, Star, Upload } from 'lucide-react';

const meta: Meta<typeof ActivityFeed> = {
  title: 'React/Components/Data Display/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ActivityFeed>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    items: [
      { id: '1', content: 'John Doe created a new project', timestamp: '2 hours ago', avatarInitials: 'JD' },
      { id: '2', content: 'Jane Smith commented on the task', timestamp: '1 hour ago', avatarInitials: 'JS' },
      { id: '3', content: 'Mike Johnson uploaded a file', timestamp: '30 minutes ago', avatarInitials: 'MJ' },
      { id: '4', content: 'Sarah Williams completed the review', timestamp: '15 minutes ago', avatarInitials: 'SW' },
    ],
  },
};

// ---------------------------------------------------------------------------
// With Icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  args: {
    items: [
      { id: '1', content: 'New comment on your post', timestamp: '2 hours ago', icon: MessageSquare },
      { id: '2', content: 'Pushed 3 commits to main', timestamp: '1 hour ago', icon: GitCommit },
      { id: '3', content: 'New team member joined', timestamp: '45 minutes ago', icon: User },
      { id: '4', content: 'Project received a star', timestamp: '30 minutes ago', icon: Star },
      { id: '5', content: 'File uploaded to assets', timestamp: '15 minutes ago', icon: Upload },
    ],
  },
};

// ---------------------------------------------------------------------------
// Without Connector
// ---------------------------------------------------------------------------

export const WithoutConnector: Story = {
  name: 'Without Connector',
  args: {
    showConnector: false,
    items: [
      { id: '1', content: 'Account created', timestamp: 'Jan 15, 2025', icon: User },
      { id: '2', content: 'First comment posted', timestamp: 'Jan 16, 2025', icon: MessageSquare },
      { id: '3', content: 'Profile updated', timestamp: 'Jan 17, 2025', icon: Star },
    ],
  },
};

// ---------------------------------------------------------------------------
// Small Size
// ---------------------------------------------------------------------------

export const SmallSize: Story = {
  name: 'Small Size',
  args: {
    size: 'sm',
    items: [
      { id: '1', content: 'File uploaded', timestamp: '5 min ago', icon: Upload },
      { id: '2', content: 'Comment added', timestamp: '3 min ago', icon: MessageSquare },
      { id: '3', content: 'Commit pushed', timestamp: '1 min ago', icon: GitCommit },
    ],
  },
};

// ---------------------------------------------------------------------------
// Rich Content
// ---------------------------------------------------------------------------

export const RichContent: Story = {
  name: 'Rich Content',
  render: () => (
    <ActivityFeed
      items={[
        {
          id: '1',
          content: <span><strong>John Doe</strong> merged pull request <strong>#142</strong> into main</span>,
          timestamp: '2 hours ago',
          avatarInitials: 'JD',
        },
        {
          id: '2',
          content: <span><strong>Jane Smith</strong> approved the review for <strong>feat/dark-mode</strong></span>,
          timestamp: '1 hour ago',
          avatarInitials: 'JS',
        },
        {
          id: '3',
          content: <span><strong>Mike Johnson</strong> opened issue <strong>Fix contrast ratio on mobile</strong></span>,
          timestamp: '45 minutes ago',
          avatarInitials: 'MJ',
        },
      ]}
      style={{ maxWidth: 480 }}
    />
  ),
};
