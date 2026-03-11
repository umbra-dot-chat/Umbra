import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThreadIndicator } from '@wisp-ui/react';
import { Avatar, Text } from '@wisp-ui/react';

const meta: Meta<typeof ThreadIndicator> = {
  title: 'React/Components/Community/ThreadIndicator',
  component: ThreadIndicator,
  tags: ['autodocs'],
  argTypes: {
    replyCount: { control: 'number' },
    lastReplyAt: { control: 'text' },
    hasUnread: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ThreadIndicator>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    replyCount: 3,
    lastReplyAt: '2 min ago',
    participantAvatars: [
      <Avatar key="a" name="Alice" size="xs" />,
      <Avatar key="b" name="Bob" size="xs" />,
    ],
  },
};

// ---------------------------------------------------------------------------
// Unread
// ---------------------------------------------------------------------------

export const Unread: Story = {
  name: 'Unread',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <SectionLabel>Read</SectionLabel>
        <ThreadIndicator
          replyCount={3}
          lastReplyAt="5 min ago"
          participantAvatars={[<Avatar key="a" name="Alice" size="xs" />]}
        />
      </div>
      <div>
        <SectionLabel>Unread</SectionLabel>
        <ThreadIndicator
          replyCount={3}
          lastReplyAt="5 min ago"
          hasUnread
          participantAvatars={[<Avatar key="a" name="Alice" size="xs" />]}
        />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// ManyParticipants
// ---------------------------------------------------------------------------

export const ManyParticipants: Story = {
  name: 'Many Participants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <SectionLabel>1 participant</SectionLabel>
        <ThreadIndicator
          replyCount={1}
          participantAvatars={[<Avatar key="a" name="Alice" size="xs" />]}
        />
      </div>
      <div>
        <SectionLabel>3 participants</SectionLabel>
        <ThreadIndicator
          replyCount={12}
          lastReplyAt="10 min ago"
          hasUnread
          participantAvatars={[
            <Avatar key="a" name="Alice" size="xs" />,
            <Avatar key="b" name="Bob" size="xs" />,
            <Avatar key="c" name="Charlie" size="xs" />,
          ]}
        />
      </div>
      <div>
        <SectionLabel>5 participants (capped at 3 shown)</SectionLabel>
        <ThreadIndicator
          replyCount={42}
          lastReplyAt="1 hour ago"
          participantAvatars={[
            <Avatar key="a" name="Alice" size="xs" />,
            <Avatar key="b" name="Bob" size="xs" />,
            <Avatar key="c" name="Charlie" size="xs" />,
            <Avatar key="d" name="Diana" size="xs" />,
            <Avatar key="e" name="Eve" size="xs" />,
          ]}
        />
      </div>
    </div>
  ),
};
