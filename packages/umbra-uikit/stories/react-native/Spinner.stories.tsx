import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '@wisp-ui/react-native';

const meta: Meta<typeof Spinner> = {
  title: 'React Native/Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    label: { control: 'text' },
    color: { control: 'color' },
    trackColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Size Scale</div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Spinner size={size} />
            <span style={{ fontSize: 11, color: '#94A0B8' }}>{size}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>With Labels</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Spinner key={size} size={size} label={`Loading (${size})...`} />
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Colors
// ---------------------------------------------------------------------------

export const Colors: Story = {
  name: 'Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Custom Colors</div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" />
          <span style={{ fontSize: 11, color: '#94A0B8' }}>Default</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#22C55E" />
          <span style={{ fontSize: 11, color: '#94A0B8' }}>Green</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#F59E0B" />
          <span style={{ fontSize: 11, color: '#94A0B8' }}>Amber</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#EF4444" />
          <span style={{ fontSize: 11, color: '#94A0B8' }}>Red</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#3B82F6" />
          <span style={{ fontSize: 11, color: '#94A0B8' }}>Blue</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Custom Track Color</div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#8B5CF6" trackColor="rgba(139, 92, 246, 0.15)" />
          <span style={{ fontSize: 11, color: '#94A0B8' }}>Purple</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#EC4899" trackColor="rgba(236, 72, 153, 0.15)" />
          <span style={{ fontSize: 11, color: '#94A0B8' }}>Pink</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#14B8A6" trackColor="rgba(20, 184, 166, 0.15)" />
          <span style={{ fontSize: 11, color: '#94A0B8' }}>Teal</span>
        </div>
      </div>
    </div>
  ),
};
