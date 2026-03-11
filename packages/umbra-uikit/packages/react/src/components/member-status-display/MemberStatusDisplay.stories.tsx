/**
 * MemberStatusDisplay -- Stories for the member status display component.
 *
 * @module stories/member-status-display
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemberStatusDisplay } from './MemberStatusDisplay';

const meta: Meta<typeof MemberStatusDisplay> = {
  title: 'Components/Community/MemberStatusDisplay',
  component: MemberStatusDisplay,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md'],
    },
    truncate: { control: 'boolean' },
    maxWidth: { control: 'number' },
    text: { control: 'text' },
    emoji: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof MemberStatusDisplay>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    emoji: '\u{1F3AE}',
    text: 'Playing a game',
    size: 'sm',
  },
};

// ---------------------------------------------------------------------------
// EmojiOnly
// ---------------------------------------------------------------------------

export const EmojiOnly: Story = {
  name: 'Emoji Only',
  args: {
    emoji: '\u{2615}',
  },
};

// ---------------------------------------------------------------------------
// TextOnly
// ---------------------------------------------------------------------------

export const TextOnly: Story = {
  name: 'Text Only',
  args: {
    text: 'Away from keyboard',
  },
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 24, fontSize: 12, color: '#888' }}>xs</span>
        <MemberStatusDisplay emoji="\u{1F3AE}" text="Playing a game" size="xs" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 24, fontSize: 12, color: '#888' }}>sm</span>
        <MemberStatusDisplay emoji="\u{1F3AE}" text="Playing a game" size="sm" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 24, fontSize: 12, color: '#888' }}>md</span>
        <MemberStatusDisplay emoji="\u{1F3AE}" text="Playing a game" size="md" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Truncated
// ---------------------------------------------------------------------------

export const Truncated: Story = {
  name: 'Truncated (Long Text)',
  render: () => (
    <div style={{ width: 200 }}>
      <MemberStatusDisplay
        emoji="\u{1F4BB}"
        text="Working on a really important project that has a very long status message"
        truncate
        maxWidth={180}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// NoTruncation
// ---------------------------------------------------------------------------

export const NoTruncation: Story = {
  name: 'No Truncation',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <MemberStatusDisplay
        emoji="\u{1F4BB}"
        text="Working on a really important project"
        truncate={false}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Various Statuses
// ---------------------------------------------------------------------------

export const VariousStatuses: Story = {
  name: 'Various Statuses',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <MemberStatusDisplay emoji="\u{1F3AE}" text="Playing a game" />
      <MemberStatusDisplay emoji="\u{1F4BB}" text="Working" />
      <MemberStatusDisplay emoji="\u{2615}" text="Coffee break" />
      <MemberStatusDisplay emoji="\u{1F634}" text="Sleeping" />
      <MemberStatusDisplay emoji="\u{1F3B5}" text="Listening to music" />
      <MemberStatusDisplay emoji="\u{1F4DA}" text="Studying" />
    </div>
  ),
};
