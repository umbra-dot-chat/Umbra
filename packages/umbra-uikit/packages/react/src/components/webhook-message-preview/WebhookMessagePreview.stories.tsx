import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WebhookMessagePreview } from './WebhookMessagePreview';

const meta: Meta<typeof WebhookMessagePreview> = {
  title: 'Components/Community/WebhookMessagePreview',
  component: WebhookMessagePreview,
  tags: ['autodocs'],
  argTypes: {
    webhookName: { control: 'text' },
    content: { control: 'text' },
    timestamp: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof WebhookMessagePreview>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    webhookName: 'GitHub',
    content: 'New commit pushed to main by @developer — Fix authentication bug in login flow',
    timestamp: 'Today at 3:45 PM',
  },
};

// ---------------------------------------------------------------------------
// With avatar
// ---------------------------------------------------------------------------

export const WithAvatar: Story = {
  name: 'With Custom Avatar',
  args: {
    webhookName: 'Sentry',
    content: 'Error: TypeError: Cannot read properties of undefined (reading "map") in Dashboard.tsx:42',
    timestamp: 'Today at 2:30 PM',
    webhookAvatar: (
      <img
        src="https://i.pravatar.cc/40?img=7"
        alt="Sentry"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ),
  },
};

// ---------------------------------------------------------------------------
// With reactions
// ---------------------------------------------------------------------------

export const WithReactions: Story = {
  name: 'With Reactions',
  args: {
    webhookName: 'CI/CD Bot',
    content: 'Build #1234 passed successfully! All 142 tests passing.',
    timestamp: 'Today at 4:00 PM',
    reactions: [
      { emoji: '🎉', count: 5, reacted: true },
      { emoji: '👍', count: 3 },
      { emoji: '🚀', count: 2 },
    ],
    onReactionClick: (emoji) => console.log('Reaction clicked:', emoji),
  },
};

// ---------------------------------------------------------------------------
// With media
// ---------------------------------------------------------------------------

export const WithMedia: Story = {
  name: 'With Media',
  args: {
    webhookName: 'Design Bot',
    content: 'New design uploaded to the project.',
    timestamp: 'Yesterday at 11:15 AM',
    media: (
      <div
        style={{
          width: 300,
          height: 180,
          borderRadius: 8,
          backgroundColor: '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: 14,
        }}
      >
        [Image Preview]
      </div>
    ),
  },
};

// ---------------------------------------------------------------------------
// Multiple messages
// ---------------------------------------------------------------------------

export const Conversation: Story = {
  name: 'Conversation',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600 }}>
      <WebhookMessagePreview
        webhookName="GitHub"
        content="PR #42 opened: Add dark mode support"
        timestamp="Today at 10:00 AM"
        reactions={[{ emoji: '👀', count: 2 }]}
      />
      <WebhookMessagePreview
        webhookName="GitHub"
        content="PR #42 merged into main by @lead-dev"
        timestamp="Today at 11:30 AM"
        reactions={[
          { emoji: '🎉', count: 4, reacted: true },
          { emoji: '🚀', count: 1 },
        ]}
      />
      <WebhookMessagePreview
        webhookName="CI/CD Bot"
        content="Deployment v2.4.1 live on production"
        timestamp="Today at 11:45 AM"
      />
    </div>
  ),
};
