import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from '@wisp-ui/react-native';

const meta: Meta<typeof Tag> = {
  title: 'React Native/Primitives/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'Tag',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Default</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag>Label</Tag>
          <Tag>Status</Tag>
          <Tag>Category</Tag>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Selected</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag selected>Label</Tag>
          <Tag selected>Status</Tag>
          <Tag selected>Category</Tag>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Disabled</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag disabled>Label</Tag>
          <Tag disabled selected>Selected</Tag>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Dismissible
// ---------------------------------------------------------------------------

export const Dismissible: Story = {
  name: 'Dismissible',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>With Remove Button</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag onRemove={() => {}}>Removable</Tag>
          <Tag onRemove={() => {}} selected>Selected</Tag>
          <Tag onRemove={() => {}} disabled>Disabled</Tag>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>All Sizes</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag size="sm" onRemove={() => {}}>Small</Tag>
          <Tag size="md" onRemove={() => {}}>Medium</Tag>
          <Tag size="lg" onRemove={() => {}}>Large</Tag>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Tag size={size}>{size}</Tag>
          <span style={{ fontSize: 10, color: '#94A0B8' }}>{size}</span>
        </div>
      ))}
    </div>
  ),
};
