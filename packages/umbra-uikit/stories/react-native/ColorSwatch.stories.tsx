import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ColorSwatch } from '@wisp-ui/react-native';

const meta: Meta<typeof ColorSwatch> = {
  title: 'React Native/Primitives/ColorSwatch',
  component: ColorSwatch,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'square', 'rounded'] },
    bordered: { control: 'boolean' },
    color: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof ColorSwatch>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    color: '#3B82F6',
    size: 'md',
    shape: 'circle',
    bordered: true,
  },
};

// ---------------------------------------------------------------------------
// 2. Selected (All Shapes)
// ---------------------------------------------------------------------------

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Circle</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ColorSwatch color="#EF4444" shape="circle" />
          <ColorSwatch color="#F59E0B" shape="circle" />
          <ColorSwatch color="#22C55E" shape="circle" />
          <ColorSwatch color="#3B82F6" shape="circle" />
          <ColorSwatch color="#8B5CF6" shape="circle" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Square</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ColorSwatch color="#EF4444" shape="square" />
          <ColorSwatch color="#F59E0B" shape="square" />
          <ColorSwatch color="#22C55E" shape="square" />
          <ColorSwatch color="#3B82F6" shape="square" />
          <ColorSwatch color="#8B5CF6" shape="square" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Rounded</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ColorSwatch color="#EF4444" shape="rounded" />
          <ColorSwatch color="#F59E0B" shape="rounded" />
          <ColorSwatch color="#22C55E" shape="rounded" />
          <ColorSwatch color="#3B82F6" shape="rounded" />
          <ColorSwatch color="#8B5CF6" shape="rounded" />
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
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <ColorSwatch color="#3B82F6" size={size} />
          <span style={{ fontSize: 10, color: '#94A0B8' }}>{size}</span>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Custom Colors
// ---------------------------------------------------------------------------

export const CustomColors: Story = {
  name: 'Custom Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Brand Colors</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ColorSwatch color="#1DA1F2" size="lg" />
          <ColorSwatch color="#FF0000" size="lg" />
          <ColorSwatch color="#25D366" size="lg" />
          <ColorSwatch color="#FF4500" size="lg" />
          <ColorSwatch color="#0A66C2" size="lg" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>With Border</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ColorSwatch color="#FFFFFF" size="lg" bordered />
          <ColorSwatch color="#F8FAFC" size="lg" bordered />
          <ColorSwatch color="#F1F5F9" size="lg" bordered />
          <ColorSwatch color="#E2E8F0" size="lg" bordered />
          <ColorSwatch color="#CBD5E1" size="lg" bordered />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Without Border</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ColorSwatch color="#EF4444" size="lg" bordered={false} />
          <ColorSwatch color="#F59E0B" size="lg" bordered={false} />
          <ColorSwatch color="#22C55E" size="lg" bordered={false} />
          <ColorSwatch color="#3B82F6" size="lg" bordered={false} />
          <ColorSwatch color="#8B5CF6" size="lg" bordered={false} />
        </div>
      </div>
    </div>
  ),
};
