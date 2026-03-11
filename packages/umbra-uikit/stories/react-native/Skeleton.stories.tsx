import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '@wisp-ui/react-native';

const meta: Meta<typeof Skeleton> = {
  title: 'React Native/Primitives/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['rectangular', 'circular', 'text'] },
    width: { control: 'number' },
    height: { control: 'number' },
    lines: { control: { type: 'range', min: 1, max: 8, step: 1 } },
    lineHeight: { control: 'number' },
    lineSpacing: { control: 'number' },
    radius: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    variant: 'rectangular',
    width: 240,
    height: 48,
  },
};

// ---------------------------------------------------------------------------
// 2. Shapes
// ---------------------------------------------------------------------------

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Rectangular</div>
        <Skeleton variant="rectangular" width={240} height={48} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Circular</div>
        <Skeleton variant="circular" width={48} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Text</div>
        <Skeleton variant="text" width={320} lines={3} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Circular Sizes</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Skeleton variant="circular" width={24} />
          <Skeleton variant="circular" width={36} />
          <Skeleton variant="circular" width={48} />
          <Skeleton variant="circular" width={64} />
          <Skeleton variant="circular" width={96} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Rectangular Heights</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 240 }}>
          <Skeleton variant="rectangular" height={24} />
          <Skeleton variant="rectangular" height={36} />
          <Skeleton variant="rectangular" height={48} />
          <Skeleton variant="rectangular" height={80} />
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Custom Dimensions
// ---------------------------------------------------------------------------

export const CustomDimensions: Story = {
  name: 'Custom Dimensions',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Card Placeholder</div>
        <Skeleton variant="rectangular" width={320} height={180} radius={12} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Text with Custom Lines</div>
        <Skeleton variant="text" width={320} lines={5} lineHeight={12} lineSpacing={6} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Profile Row</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton variant="rectangular" width={140} height={14} radius={4} />
            <Skeleton variant="rectangular" width={100} height={12} radius={4} />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Content Placeholders
// ---------------------------------------------------------------------------

export const ContentPlaceholders: Story = {
  name: 'Content Placeholders',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>List Items</div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <Skeleton variant="rectangular" height={14} radius={4} />
            <Skeleton variant="rectangular" height={12} width={180} radius={4} />
          </div>
        </div>
      ))}
    </div>
  ),
};
