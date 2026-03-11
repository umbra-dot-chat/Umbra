import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VStack, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof VStack> = {
  title: 'React Native/Layouts/VStack',
  component: VStack,
  tags: ['autodocs'],
  argTypes: {
    gap: { control: 'select', options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between', 'around', 'evenly'] },
    wrap: { control: 'boolean' },
    reverse: { control: 'boolean' },
    divider: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof VStack>;

/** Reusable colored box for demos. */
const Box = ({ color = '#3b82f6', width = 120, height = 36, label }: { color?: string; width?: number; height?: number; label?: string }) => (
  <div
    style={{
      width,
      height,
      backgroundColor: color,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 11,
      fontWeight: 600,
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
    gap: 'md',
    children: (
      <>
        <Text>First item</Text>
        <Text>Second item</Text>
        <Text>Third item</Text>
      </>
    ),
  },
};

// ---------------------------------------------------------------------------
// 2. Gap Sizes
// ---------------------------------------------------------------------------

export const GapSizes: Story = {
  name: 'Gap Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      {(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).map((gap) => (
        <div key={gap}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            gap="{gap}"
          </div>
          <VStack gap={gap}>
            <Box color="#3b82f6" label="A" />
            <Box color="#8b5cf6" label="B" />
            <Box color="#ec4899" label="C" />
          </VStack>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Alignment
// ---------------------------------------------------------------------------

export const Alignment: Story = {
  name: 'Alignment',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Align (cross-axis)
        </div>
        {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
          <div key={align} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#94A0B8', letterSpacing: 1, marginBottom: 4 }}>
              align="{align}"
            </div>
            <VStack gap="sm" align={align} style={{ width: 240, border: '1px dashed #334155', borderRadius: 6, padding: 8 }}>
              <Box color="#3b82f6" width={60} label="A" />
              <Box color="#8b5cf6" width={100} label="B" />
              <Box color="#ec4899" width={140} label="C" />
            </VStack>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Justify (main-axis)
        </div>
        {(['start', 'center', 'end', 'between', 'around', 'evenly'] as const).map((justify) => (
          <div key={justify} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#94A0B8', letterSpacing: 1, marginBottom: 4 }}>
              justify="{justify}"
            </div>
            <VStack gap="sm" justify={justify} style={{ height: 200, width: 160, border: '1px dashed #334155', borderRadius: 6, padding: 8 }}>
              <Box color="#3b82f6" width={120} label="A" />
              <Box color="#8b5cf6" width={120} label="B" />
              <Box color="#ec4899" width={120} label="C" />
            </VStack>
          </div>
        ))}
      </div>
    </div>
  ),
};
