import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThreadFollowButton, Text } from '@wisp-ui/react';

const meta: Meta<typeof ThreadFollowButton> = {
  title: 'React/Components/Community/ThreadFollowButton',
  component: ThreadFollowButton,
  tags: ['autodocs'],
  argTypes: {
    isFollowing: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
    followLabel: { control: 'text' },
    followingLabel: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ThreadFollowButton>;

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
    isFollowing: false,
    size: 'sm',
  },
};

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export const States: Story = {
  name: 'States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <SectionLabel>Not Following</SectionLabel>
        <ThreadFollowButton isFollowing={false} />
      </div>
      <div>
        <SectionLabel>Following</SectionLabel>
        <ThreadFollowButton isFollowing={true} />
      </div>
      <div>
        <SectionLabel>Disabled (not following)</SectionLabel>
        <ThreadFollowButton isFollowing={false} disabled />
      </div>
      <div>
        <SectionLabel>Disabled (following)</SectionLabel>
        <ThreadFollowButton isFollowing={true} disabled />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <SectionLabel>Small (sm)</SectionLabel>
        <div style={{ display: 'flex', gap: 12 }}>
          <ThreadFollowButton isFollowing={false} size="sm" />
          <ThreadFollowButton isFollowing={true} size="sm" />
        </div>
      </div>
      <div>
        <SectionLabel>Medium (md)</SectionLabel>
        <div style={{ display: 'flex', gap: 12 }}>
          <ThreadFollowButton isFollowing={false} size="md" />
          <ThreadFollowButton isFollowing={true} size="md" />
        </div>
      </div>
    </div>
  ),
};
