import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VideoGrid } from './VideoGrid';
import type { VideoParticipant } from '@coexist/wisp-core/types/VideoGrid.types';
import { Text } from '../../primitives/text';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof VideoGrid> = {
  title: 'Components/VideoGrid',
  component: VideoGrid,
  tags: ['autodocs'],
  argTypes: {
    layout: { control: 'select', options: ['grid', 'spotlight'] },
    maxVisible: { control: 'number' },
    showOverflowCount: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 800, height: 500 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof VideoGrid>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

const makeParticipants = (count: number): VideoParticipant[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p-${i}`,
    name: `User ${i + 1}`,
    isMuted: i % 3 === 0,
    isSpeaking: i === 0,
    isCameraOff: i % 4 === 0,
  }));

// ---------------------------------------------------------------------------
// 1. Default (playground)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    participants: makeParticipants(6),
    layout: 'grid',
    maxVisible: 25,
    showOverflowCount: true,
    skeleton: false,
  },
};

// ---------------------------------------------------------------------------
// 2. Single participant
// ---------------------------------------------------------------------------

export const SingleParticipant: Story = {
  name: 'Single Participant',
  args: {
    participants: makeParticipants(1),
    layout: 'grid',
  },
};

// ---------------------------------------------------------------------------
// 3. Two participants
// ---------------------------------------------------------------------------

export const TwoParticipants: Story = {
  name: 'Two Participants',
  args: {
    participants: makeParticipants(2),
    layout: 'grid',
  },
};

// ---------------------------------------------------------------------------
// 4. Large group
// ---------------------------------------------------------------------------

export const LargeGroup: Story = {
  name: 'Large Group (12)',
  args: {
    participants: makeParticipants(12),
    layout: 'grid',
  },
};

// ---------------------------------------------------------------------------
// 5. Spotlight layout
// ---------------------------------------------------------------------------

export const Spotlight: Story = {
  name: 'Spotlight Layout',
  args: {
    participants: makeParticipants(6),
    layout: 'spotlight',
    spotlightId: 'p-0',
  },
};

// ---------------------------------------------------------------------------
// 6. Overflow
// ---------------------------------------------------------------------------

export const WithOverflow: Story = {
  name: 'With Overflow',
  args: {
    participants: makeParticipants(30),
    maxVisible: 9,
    showOverflowCount: true,
  },
};

// ---------------------------------------------------------------------------
// 7. All states
// ---------------------------------------------------------------------------

export const AllStates: Story = {
  name: 'All States',
  render: () => {
    const participants: VideoParticipant[] = [
      { id: '1', name: 'Active Speaker', isSpeaking: true },
      { id: '2', name: 'Muted User', isMuted: true },
      { id: '3', name: 'Deafened User', isDeafened: true },
      { id: '4', name: 'Screen Sharing', isScreenSharing: true },
      { id: '5', name: 'Camera Off', isCameraOff: true },
      { id: '6', name: 'Normal User' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>All participant states</SectionLabel>
        <div style={{ width: 800, height: 400 }}>
          <VideoGrid participants={participants} />
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 8. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    participants: [],
    skeleton: true,
  },
};
