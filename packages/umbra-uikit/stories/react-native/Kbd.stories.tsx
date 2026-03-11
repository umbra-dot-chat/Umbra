import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Kbd } from '@wisp-ui/react-native';

const meta: Meta<typeof Kbd> = {
  title: 'React Native/Primitives/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'Esc',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Combinations
// ---------------------------------------------------------------------------

export const Combinations: Story = {
  name: 'Combinations',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Single Keys</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Kbd>Esc</Kbd>
          <Kbd>Tab</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Space</Kbd>
          <Kbd>Delete</Kbd>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Modifier Keys</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Kbd>&#8984;</Kbd>
          <Kbd>&#8679;</Kbd>
          <Kbd>&#8997;</Kbd>
          <Kbd>Ctrl</Kbd>
          <Kbd>Fn</Kbd>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Shortcuts</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Kbd>&#8984;</Kbd>
            <span style={{ fontSize: 12, color: '#94A0B8' }}>+</span>
            <Kbd>C</Kbd>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Kbd>&#8984;</Kbd>
            <span style={{ fontSize: 12, color: '#94A0B8' }}>+</span>
            <Kbd>&#8679;</Kbd>
            <span style={{ fontSize: 12, color: '#94A0B8' }}>+</span>
            <Kbd>P</Kbd>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Kbd>Ctrl</Kbd>
            <span style={{ fontSize: 12, color: '#94A0B8' }}>+</span>
            <Kbd>Alt</Kbd>
            <span style={{ fontSize: 12, color: '#94A0B8' }}>+</span>
            <Kbd>Delete</Kbd>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, fontSize: 11, color: '#94A0B8' }}>{size}</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Kbd size={size}>&#8984;</Kbd>
            <span style={{ fontSize: 12, color: '#94A0B8' }}>+</span>
            <Kbd size={size}>&#8679;</Kbd>
            <span style={{ fontSize: 12, color: '#94A0B8' }}>+</span>
            <Kbd size={size}>K</Kbd>
          </div>
        </div>
      ))}
    </div>
  ),
};
