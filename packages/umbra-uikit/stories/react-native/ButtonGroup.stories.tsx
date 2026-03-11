import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonGroup } from '@wisp-ui/react-native';

const meta: Meta<typeof ButtonGroup> = {
  title: 'React Native/Components/Utilities/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['outline', 'ghost'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

const defaultItems = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const viewItems = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    items: defaultItems,
    defaultValue: 'center',
    variant: 'outline',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{size}</div>
          <ButtonGroup items={viewItems} defaultValue="grid" size={size} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Outline</div>
        <ButtonGroup items={defaultItems} defaultValue="left" variant="outline" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ghost</div>
        <ButtonGroup items={defaultItems} defaultValue="left" variant="ghost" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Full Width</div>
      <ButtonGroup items={viewItems} defaultValue="list" fullWidth />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>All Disabled</div>
        <ButtonGroup items={defaultItems} defaultValue="center" disabled />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Single Item Disabled</div>
        <ButtonGroup
          items={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center', disabled: true },
            { value: 'right', label: 'Right' },
          ]}
          defaultValue="left"
        />
      </div>
    </div>
  ),
};
