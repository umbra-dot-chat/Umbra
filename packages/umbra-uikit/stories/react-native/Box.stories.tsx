import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Box> = {
  title: 'React Native/Layouts/Box',
  component: Box,
  tags: ['autodocs'],
  argTypes: {
    p: { control: 'select', options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
    px: { control: 'select', options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
    py: { control: 'select', options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
    radius: { control: 'select', options: ['none', 'sm', 'md', 'lg', 'xl', 'full'] },
    width: { control: 'number' },
    height: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Box>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

const demoBox = {
  backgroundColor: '#E8EAED',
  borderWidth: 1,
  borderColor: '#D0D5DD',
  borderStyle: 'dashed' as const,
};

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    p: 'md',
    width: 200,
    height: 100,
  },
  render: (args) => (
    <Box {...args} style={{ backgroundColor: '#F0F2F5' }}>
      <Text>Box content</Text>
    </Box>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Padding
// ---------------------------------------------------------------------------

export const WithPadding: Story = {
  name: 'With Padding',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionLabel}>Uniform padding (p)</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
          <Box key={size} p={size} style={demoBox}>
            <Text>{size}</Text>
          </Box>
        ))}
      </div>

      <div style={sectionLabel}>Horizontal padding (px)</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Box key={size} px={size} py="xs" style={demoBox}>
            <Text>px={size}</Text>
          </Box>
        ))}
      </div>

      <div style={sectionLabel}>Vertical padding (py)</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Box key={size} py={size} px="xs" style={demoBox}>
            <Text>py={size}</Text>
          </Box>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Radius
// ---------------------------------------------------------------------------

export const WithRadius: Story = {
  name: 'With Radius',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionLabel}>Border radius tokens</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {(['none', 'sm', 'md', 'lg', 'xl', 'full'] as const).map((r) => (
          <Box
            key={r}
            radius={r}
            width={64}
            height={64}
            style={{ backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 11 }}>{r}</Text>
          </Box>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Combined
// ---------------------------------------------------------------------------

export const Combined: Story = {
  name: 'Combined',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionLabel}>Padding + Radius + Sizing</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Box p="md" radius="md" width={160} height={80} style={{ backgroundColor: '#DBEAFE' }}>
          <Text>p=md, radius=md</Text>
        </Box>
        <Box px="xl" py="sm" radius="lg" style={{ backgroundColor: '#FEF3C7' }}>
          <Text>px=xl, py=sm, radius=lg</Text>
        </Box>
        <Box p="lg" radius="full" width={100} height={100} style={{ backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' }}>
          <Text>Full</Text>
        </Box>
      </div>

      <div style={sectionLabel}>Directional padding overrides</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Box pt="xl" pr="sm" pb="xs" pl="2xl" style={demoBox}>
          <Text>pt=xl pr=sm pb=xs pl=2xl</Text>
        </Box>
        <Box p="sm" pt="xl" style={demoBox}>
          <Text>p=sm, pt=xl (override)</Text>
        </Box>
      </div>
    </div>
  ),
};
