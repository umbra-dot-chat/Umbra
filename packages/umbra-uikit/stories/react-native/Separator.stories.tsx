import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Separator, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Separator> = {
  title: 'React Native/Layouts/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    variant: { control: 'select', options: ['subtle', 'strong'] },
    spacing: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    orientation: 'horizontal',
    variant: 'subtle',
    spacing: 'md',
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Text size="sm">Above</Text>
      <Separator {...args} />
      <Text size="sm">Below</Text>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Horizontal (default)</div>
      <div>
        <Text size="sm">Section one</Text>
        <Separator orientation="horizontal" />
        <Text size="sm">Section two</Text>
        <Separator orientation="horizontal" />
        <Text size="sm">Section three</Text>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Vertical
// ---------------------------------------------------------------------------

export const Vertical: Story = {
  name: 'Vertical',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Vertical</div>
      <div style={{ display: 'flex', alignItems: 'center', height: 32 }}>
        <Text size="sm">Left</Text>
        <Separator orientation="vertical" />
        <Text size="sm">Center</Text>
        <Separator orientation="vertical" />
        <Text size="sm">Right</Text>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Subtle (default)</div>
        <Text size="sm">Above</Text>
        <Separator variant="subtle" />
        <Text size="sm">Below</Text>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Strong</div>
        <Text size="sm">Above</Text>
        <Separator variant="strong" />
        <Text size="sm">Below</Text>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Spacing
// ---------------------------------------------------------------------------

export const Spacing: Story = {
  name: 'Spacing',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
      {(['none', 'sm', 'md', 'lg'] as const).map((sp) => (
        <div key={sp}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            spacing=&quot;{sp}&quot;
          </div>
          <div style={{ background: '#F3F4F8', borderRadius: 6, padding: 8 }}>
            <Text size="sm">Content above</Text>
            <Separator spacing={sp} variant="strong" />
            <Text size="sm">Content below</Text>
          </div>
        </div>
      ))}
    </div>
  ),
};
