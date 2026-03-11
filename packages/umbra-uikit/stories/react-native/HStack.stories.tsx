import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { HStack, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof HStack> = {
  title: 'React Native/Layouts/HStack',
  component: HStack,
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
type Story = StoryObj<typeof HStack>;

/** Reusable colored box for demos. */
const Box = ({ color = '#3b82f6', width = 48, height = 48, label }: { color?: string; width?: number; height?: number; label?: string }) => (
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
        <Text>First</Text>
        <Text>Second</Text>
        <Text>Third</Text>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).map((gap) => (
        <div key={gap}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            gap="{gap}"
          </div>
          <HStack gap={gap}>
            <Box color="#3b82f6" label="A" />
            <Box color="#8b5cf6" label="B" />
            <Box color="#ec4899" label="C" />
          </HStack>
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
            <HStack gap="md" align={align} style={{ height: 80, border: '1px dashed #334155', borderRadius: 6, padding: 8 }}>
              <Box color="#3b82f6" height={24} label="A" />
              <Box color="#8b5cf6" height={40} label="B" />
              <Box color="#ec4899" height={56} label="C" />
            </HStack>
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
            <HStack gap="sm" justify={justify} style={{ border: '1px dashed #334155', borderRadius: 6, padding: 8 }}>
              <Box color="#3b82f6" label="A" />
              <Box color="#8b5cf6" label="B" />
              <Box color="#ec4899" label="C" />
            </HStack>
          </div>
        ))}
      </div>
    </div>
  ),
};
