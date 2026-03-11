import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, Button, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Tooltip> = {
  title: 'React Native/Components/Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    placement: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
    delay: { control: 'number' },
    displayDuration: { control: 'number' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    placement: 'top',
    children: <Button>Long press me</Button>,
  },
};

// ---------------------------------------------------------------------------
// 2. Positions
// ---------------------------------------------------------------------------

export const Positions: Story = {
  name: 'Positions',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', paddingTop: 60, paddingBottom: 60 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Placement options</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Tooltip content="Placed on top" placement="top">
          <Button size="sm">Top</Button>
        </Tooltip>
        <Tooltip content="Placed on bottom" placement="bottom">
          <Button size="sm">Bottom</Button>
        </Tooltip>
        <Tooltip content="Placed on left" placement="left">
          <Button size="sm">Left</Button>
        </Tooltip>
        <Tooltip content="Placed on right" placement="right">
          <Button size="sm">Right</Button>
        </Tooltip>
      </div>
      <Text size="xs" color="secondary">Long press each button to reveal its tooltip</Text>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Delay
// ---------------------------------------------------------------------------

export const WithDelay: Story = {
  name: 'With Delay',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Custom delay durations</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Tooltip content="Instant (0ms)" delay={0} displayDuration={2000}>
          <Button size="sm">No delay</Button>
        </Tooltip>
        <Tooltip content="Default (500ms)" delay={500} displayDuration={2000}>
          <Button size="sm">500ms</Button>
        </Tooltip>
        <Tooltip content="Slow (1500ms)" delay={1500} displayDuration={2000}>
          <Button size="sm">1500ms</Button>
        </Tooltip>
      </div>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Display duration</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Tooltip content="Disappears quickly" delay={0} displayDuration={800}>
          <Button size="sm">Short (800ms)</Button>
        </Tooltip>
        <Tooltip content="Stays visible longer" delay={0} displayDuration={5000}>
          <Button size="sm">Long (5s)</Button>
        </Tooltip>
      </div>
    </div>
  ),
};
