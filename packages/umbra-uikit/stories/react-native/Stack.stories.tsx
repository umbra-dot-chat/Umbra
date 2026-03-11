import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stack, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Stack> = {
  title: 'React Native/Layouts/Stack',
  component: Stack,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['vertical', 'horizontal'] },
    gap: { control: 'select', options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between', 'around', 'evenly'] },
    wrap: { control: 'boolean' },
    reverse: { control: 'boolean' },
    divider: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

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
    direction: 'vertical',
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
// 2. Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => (
    <Stack direction="horizontal" gap="md">
      <Box color="#3b82f6" label="A" />
      <Box color="#8b5cf6" label="B" />
      <Box color="#ec4899" label="C" />
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// 3. Vertical
// ---------------------------------------------------------------------------

export const Vertical: Story = {
  name: 'Vertical',
  render: () => (
    <Stack direction="vertical" gap="md">
      <Box color="#3b82f6" width={120} label="A" />
      <Box color="#8b5cf6" width={120} label="B" />
      <Box color="#ec4899" width={120} label="C" />
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// 4. Gap Sizes
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
          <Stack direction="horizontal" gap={gap}>
            <Box color="#3b82f6" label="A" />
            <Box color="#8b5cf6" label="B" />
            <Box color="#ec4899" label="C" />
          </Stack>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Alignment
// ---------------------------------------------------------------------------

export const WithAlignment: Story = {
  name: 'With Alignment',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
        <div key={align}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            align="{align}"
          </div>
          <Stack direction="horizontal" gap="md" align={align} style={{ height: 80, border: '1px dashed #334155', borderRadius: 6, padding: 8 }}>
            <Box color="#3b82f6" height={24} label="A" />
            <Box color="#8b5cf6" height={40} label="B" />
            <Box color="#ec4899" height={56} label="C" />
          </Stack>
        </div>
      ))}

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Justify
      </div>
      {(['start', 'center', 'end', 'between', 'around', 'evenly'] as const).map((justify) => (
        <div key={justify}>
          <div style={{ fontSize: 11, color: '#94A0B8', letterSpacing: 1, marginBottom: 4 }}>
            justify="{justify}"
          </div>
          <Stack direction="horizontal" gap="sm" justify={justify} style={{ border: '1px dashed #334155', borderRadius: 6, padding: 8 }}>
            <Box color="#3b82f6" label="A" />
            <Box color="#8b5cf6" label="B" />
            <Box color="#ec4899" label="C" />
          </Stack>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. With Dividers
// ---------------------------------------------------------------------------

export const WithDividers: Story = {
  name: 'With Dividers',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Vertical Dividers
        </div>
        <Stack direction="vertical" gap="md" divider>
          <Text>First item</Text>
          <Text>Second item</Text>
          <Text>Third item</Text>
        </Stack>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Horizontal Dividers
        </div>
        <Stack direction="horizontal" gap="md" divider>
          <Text>Left</Text>
          <Text>Center</Text>
          <Text>Right</Text>
        </Stack>
      </div>
    </div>
  ),
};
