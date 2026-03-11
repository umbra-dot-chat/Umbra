import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Card> = {
  title: 'React Native/Layouts/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['elevated', 'outlined', 'filled'] },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    radius: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    variant: 'elevated',
    padding: 'md',
    radius: 'md',
  },
  render: (args) => (
    <Card {...args}>
      <Text>Default elevated card</Text>
    </Card>
  ),
};

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={sectionLabel}>Elevated</div>
      <Card variant="elevated">
        <Text>Elevated card with subtle shadow and surface background.</Text>
      </Card>

      <div style={sectionLabel}>Outlined</div>
      <Card variant="outlined">
        <Text>Outlined card with a visible border and transparent background.</Text>
      </Card>

      <div style={sectionLabel}>Filled</div>
      <Card variant="filled">
        <Text>Filled card with a solid surface background, no border.</Text>
      </Card>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Padding
// ---------------------------------------------------------------------------

export const Padding: Story = {
  name: 'Padding',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={sectionLabel}>Padding presets</div>
      {(['none', 'sm', 'md', 'lg'] as const).map((p) => (
        <Card key={p} variant="outlined" padding={p}>
          <Text>padding=&quot;{p}&quot;</Text>
        </Card>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Content
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 360 }}>
      <div style={sectionLabel}>Card with structured content</div>
      <Card variant="elevated" padding="lg">
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Card Title</Text>
        <Text style={{ fontSize: 13, color: '#6B7280' }}>
          Supporting description text that explains the content of this card in more detail.
        </Text>
      </Card>

      <div style={sectionLabel}>Disabled card</div>
      <Card variant="elevated" padding="md" disabled>
        <Text>This card is disabled and has reduced opacity.</Text>
      </Card>

      <div style={sectionLabel}>Side-by-side variants</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {(['elevated', 'outlined', 'filled'] as const).map((v) => (
          <Card key={v} variant={v} padding="sm" radius="lg" style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 2 }}>{v}</Text>
            <Text style={{ fontSize: 11, color: '#6B7280' }}>radius=lg</Text>
          </Card>
        ))}
      </div>
    </div>
  ),
};
