import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from '@wisp-ui/react-native';

const meta: Meta<typeof AspectRatio> = {
  title: 'React Native/Layouts/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
  argTypes: {
    ratio: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const Placeholder = ({ label }: { label: string }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F0F2F5',
      border: '1px solid #E2E6ED',
      borderRadius: 8,
      fontSize: 13,
      color: '#3B4963',
    }}
  >
    {label}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    ratio: 16 / 9,
    children: <Placeholder label="16 : 9" />,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
};

// ---------------------------------------------------------------------------
// 2. Ratios
// ---------------------------------------------------------------------------

export const Ratios: Story = {
  name: 'Ratios',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 360 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          16 : 9
        </div>
        <AspectRatio ratio={16 / 9}>
          <Placeholder label="16 : 9" />
        </AspectRatio>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          4 : 3
        </div>
        <AspectRatio ratio={4 / 3}>
          <Placeholder label="4 : 3" />
        </AspectRatio>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          1 : 1
        </div>
        <AspectRatio ratio={1}>
          <Placeholder label="1 : 1" />
        </AspectRatio>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Side by Side
// ---------------------------------------------------------------------------

export const SideBySide: Story = {
  name: 'Side by Side',
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          21 : 9
        </div>
        <AspectRatio ratio={21 / 9}>
          <Placeholder label="21 : 9" />
        </AspectRatio>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          3 : 4
        </div>
        <AspectRatio ratio={3 / 4}>
          <Placeholder label="3 : 4" />
        </AspectRatio>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          1 : 1
        </div>
        <AspectRatio ratio={1}>
          <Placeholder label="1 : 1" />
        </AspectRatio>
      </div>
    </div>
  ),
};
