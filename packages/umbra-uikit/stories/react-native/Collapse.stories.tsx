import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Collapse, Button, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Collapse> = {
  title: 'React Native/Layouts/Collapse',
  component: Collapse,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    duration: { control: 'select', options: ['fast', 'normal', 'slow'] },
    unmountOnClose: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Collapse>;

/** Sample block of content for collapse demos. */
const SampleContent = ({ label = 'Collapsed content' }: { label?: string }) => (
  <div
    style={{
      padding: 16,
      backgroundColor: '#1E293B',
      borderRadius: 6,
      color: '#CBD5E1',
      fontSize: 13,
      lineHeight: 1.5,
    }}
  >
    <strong style={{ color: '#F1F5F9' }}>{label}</strong>
    <br />
    This content is revealed when the collapse is expanded. It can contain any child elements including text,
    images, or other components.
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Toggle to expand</div>
        <Button size="sm" onPress={() => setOpen((v) => !v)}>
          {open ? 'Collapse' : 'Expand'}
        </Button>
        <Collapse open={open}>
          <SampleContent />
        </Collapse>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. Initially Open
// ---------------------------------------------------------------------------

export const InitiallyOpen: Story = {
  name: 'Initially Open',
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Starts expanded</div>
        <Button size="sm" onPress={() => setOpen((v) => !v)}>
          {open ? 'Collapse' : 'Expand'}
        </Button>
        <Collapse open={open}>
          <SampleContent label="Initially visible" />
        </Collapse>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [open, setOpen] = useState(false);
    const [transitionCount, setTransitionCount] = useState(0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>With onTransitionEnd callback</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button size="sm" onPress={() => setOpen((v) => !v)}>
            {open ? 'Collapse' : 'Expand'}
          </Button>
          <Text style={{ fontSize: 12, color: '#94A0B8' }}>
            Transitions: {transitionCount}
          </Text>
        </div>
        <Collapse
          open={open}
          onTransitionEnd={() => setTransitionCount((c) => c + 1)}
        >
          <SampleContent label="Controlled collapse" />
        </Collapse>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Duration Presets
// ---------------------------------------------------------------------------

export const DurationPresets: Story = {
  name: 'Duration Presets',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
        <Button size="sm" onPress={() => setOpen((v) => !v)}>
          {open ? 'Collapse All' : 'Expand All'}
        </Button>
        {(['fast', 'normal', 'slow'] as const).map((duration) => (
          <div key={duration}>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              duration="{duration}"
            </div>
            <Collapse open={open} duration={duration}>
              <SampleContent label={`${duration} animation`} />
            </Collapse>
          </div>
        ))}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. Unmount On Close
// ---------------------------------------------------------------------------

export const UnmountOnClose: Story = {
  name: 'Unmount On Close',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Children unmounted when closed</div>
        <Button size="sm" onPress={() => setOpen((v) => !v)}>
          {open ? 'Collapse' : 'Expand'}
        </Button>
        <Collapse open={open} unmountOnClose>
          <SampleContent label="Unmounted when collapsed" />
        </Collapse>
      </div>
    );
  },
};
