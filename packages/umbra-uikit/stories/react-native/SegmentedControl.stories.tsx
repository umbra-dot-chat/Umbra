import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SegmentedControl } from '@wisp-ui/react-native';

const meta: Meta<typeof SegmentedControl> = {
  title: 'React Native/Components/Navigation/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const viewOptions = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board' },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    options: themeOptions,
    defaultValue: 'light',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 360 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>{size.toUpperCase()}</div>
          <SegmentedControl options={viewOptions} defaultValue="list" size={size} />
        </div>
      ))}

      <div style={{ ...sectionLabel, marginBottom: 8 }}>Full Width</div>
      <SegmentedControl options={themeOptions} defaultValue="system" size="md" fullWidth />

      <div style={{ ...sectionLabel, marginBottom: 8 }}>Disabled</div>
      <SegmentedControl options={themeOptions} defaultValue="dark" size="md" disabled />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [value, setValue] = useState('list');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
        <div style={sectionLabel}>Controlled State</div>
        <SegmentedControl
          options={viewOptions}
          value={value}
          onChange={setValue}
        />
        <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
          Selected: &quot;{value}&quot;
        </div>
      </div>
    );
  },
};
