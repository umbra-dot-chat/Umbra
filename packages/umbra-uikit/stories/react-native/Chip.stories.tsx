import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from '@wisp-ui/react-native';

const meta: Meta<typeof Chip> = {
  title: 'React Native/Primitives/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    color: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info'] },
    variant: { control: 'select', options: ['filled', 'outlined', 'subtle'] },
    removable: { control: 'boolean' },
    clickable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'Chip',
    size: 'md',
    color: 'default',
    variant: 'filled',
  },
};

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Filled</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip variant="filled" color="default">Default</Chip>
        <Chip variant="filled" color="success">Success</Chip>
        <Chip variant="filled" color="warning">Warning</Chip>
        <Chip variant="filled" color="danger">Danger</Chip>
        <Chip variant="filled" color="info">Info</Chip>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Outlined</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip variant="outlined" color="default">Default</Chip>
        <Chip variant="outlined" color="success">Success</Chip>
        <Chip variant="outlined" color="warning">Warning</Chip>
        <Chip variant="outlined" color="danger">Danger</Chip>
        <Chip variant="outlined" color="info">Info</Chip>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Subtle</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip variant="subtle" color="default">Default</Chip>
        <Chip variant="subtle" color="success">Success</Chip>
        <Chip variant="subtle" color="warning">Warning</Chip>
        <Chip variant="subtle" color="danger">Danger</Chip>
        <Chip variant="subtle" color="info">Info</Chip>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Selected (Clickable)
// ---------------------------------------------------------------------------

export const Selected: Story = {
  name: 'Selected',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Clickable chips</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip clickable onPress={() => {}}>React</Chip>
        <Chip clickable onPress={() => {}}>TypeScript</Chip>
        <Chip clickable onPress={() => {}} color="success">Active</Chip>
        <Chip clickable onPress={() => {}} color="info">Selected</Chip>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Removable chips</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip removable onRemove={() => {}}>Tag A</Chip>
        <Chip removable onRemove={() => {}} color="success">Tag B</Chip>
        <Chip removable onRemove={() => {}} color="info">Tag C</Chip>
        <Chip removable onRemove={() => {}} color="warning">Tag D</Chip>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Sizes</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Chip size="sm" removable onRemove={() => {}}>Small</Chip>
        <Chip size="md" removable onRemove={() => {}}>Medium</Chip>
        <Chip size="lg" removable onRemove={() => {}}>Large</Chip>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled vs enabled</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip>Enabled</Chip>
        <Chip disabled>Disabled</Chip>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled across variants</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip disabled variant="filled" color="success">Filled</Chip>
        <Chip disabled variant="outlined" color="success">Outlined</Chip>
        <Chip disabled variant="subtle" color="success">Subtle</Chip>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled removable</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip disabled removable onRemove={() => {}}>Cannot remove</Chip>
        <Chip disabled clickable onPress={() => {}}>Cannot click</Chip>
      </div>
    </div>
  ),
};
