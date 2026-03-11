import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RecordingIndicator } from './RecordingIndicator';
import { Text } from '../../primitives/text';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof RecordingIndicator> = {
  title: 'Components/RecordingIndicator',
  component: RecordingIndicator,
  tags: ['autodocs'],
  argTypes: {
    isRecording: { control: 'boolean' },
    duration: { control: 'number' },
    variant: { control: 'select', options: ['badge', 'controls'] },
    size: { control: 'select', options: ['sm', 'md'] },
    canRecord: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof RecordingIndicator>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default (playground)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    isRecording: true,
    duration: 125,
    variant: 'badge',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Badge variant
// ---------------------------------------------------------------------------

export const BadgeVariant: Story = {
  name: 'Badge Variant',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Recording active</SectionLabel>
      <RecordingIndicator isRecording={true} duration={65} variant="badge" />

      <SectionLabel>Recording active - no duration</SectionLabel>
      <RecordingIndicator isRecording={true} variant="badge" />

      <SectionLabel>Not recording</SectionLabel>
      <RecordingIndicator isRecording={false} variant="badge" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Controls variant
// ---------------------------------------------------------------------------

export const ControlsVariant: Story = {
  name: 'Controls Variant',
  render: () => {
    const [recording, setRecording] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
      if (!recording) return;
      const interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
      return () => clearInterval(interval);
    }, [recording]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>Interactive controls</SectionLabel>
        <RecordingIndicator
          isRecording={recording}
          duration={duration}
          variant="controls"
          canRecord={true}
          onStartRecording={() => {
            setRecording(true);
            setDuration(0);
          }}
          onStopRecording={() => setRecording(false)}
        />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Small</SectionLabel>
      <RecordingIndicator isRecording={true} duration={42} size="sm" />

      <SectionLabel>Medium</SectionLabel>
      <RecordingIndicator isRecording={true} duration={42} size="md" />

      <SectionLabel>Small controls</SectionLabel>
      <RecordingIndicator
        isRecording={true}
        duration={42}
        size="sm"
        variant="controls"
        onStopRecording={() => {}}
      />

      <SectionLabel>Medium controls</SectionLabel>
      <RecordingIndicator
        isRecording={true}
        duration={42}
        size="md"
        variant="controls"
        onStopRecording={() => {}}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. All states
// ---------------------------------------------------------------------------

export const AllStates: Story = {
  name: 'All States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Badge - recording</SectionLabel>
      <RecordingIndicator isRecording={true} duration={90} variant="badge" />

      <SectionLabel>Badge - not recording</SectionLabel>
      <RecordingIndicator isRecording={false} variant="badge" />

      <SectionLabel>Controls - recording</SectionLabel>
      <RecordingIndicator
        isRecording={true}
        duration={90}
        variant="controls"
        onStopRecording={() => {}}
      />

      <SectionLabel>Controls - not recording, can record</SectionLabel>
      <RecordingIndicator
        isRecording={false}
        variant="controls"
        canRecord={true}
        onStartRecording={() => {}}
      />

      <SectionLabel>Controls - not recording, cannot record</SectionLabel>
      <RecordingIndicator
        isRecording={false}
        variant="controls"
        canRecord={false}
      />
    </div>
  ),
};
