import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Spacer, Text, HStack } from '@wisp-ui/react-native';

const meta: Meta<typeof Spacer> = {
  title: 'React Native/Layouts/Spacer',
  component: Spacer,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
    flex: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Spacer>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    size: 'md',
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', width: 320 }}>
      <Text size="sm">Above</Text>
      <Spacer {...args} />
      <Text size="sm">Below</Text>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Fixed sizes</div>
      {(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, fontSize: 11, color: '#94A0B8' }}>{size}</div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ background: '#E2E8F0', borderRadius: 4, padding: '2px 8px' }}>
              <Text size="xs">A</Text>
            </div>
            <Spacer size={size} />
            <div style={{ background: '#E2E8F0', borderRadius: 4, padding: '2px 8px' }}>
              <Text size="xs">B</Text>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. InHStack
// ---------------------------------------------------------------------------

export const InHStack: Story = {
  name: 'In HStack',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 400 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Flex spacer pushes items apart</div>
        <HStack style={{ backgroundColor: '#F3F4F8', borderRadius: 6, padding: 8 }}>
          <Text size="sm">Left</Text>
          <Spacer flex />
          <Text size="sm">Right</Text>
        </HStack>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Fixed size between items</div>
        <HStack style={{ backgroundColor: '#F3F4F8', borderRadius: 6, padding: 8 }}>
          <Text size="sm">One</Text>
          <Spacer size="xl" />
          <Text size="sm">Two</Text>
          <Spacer size="xl" />
          <Text size="sm">Three</Text>
        </HStack>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Custom flex ratio</div>
        <HStack style={{ backgroundColor: '#F3F4F8', borderRadius: 6, padding: 8 }}>
          <Text size="sm">Start</Text>
          <Spacer flex={2} />
          <Text size="sm">Middle</Text>
          <Spacer flex={1} />
          <Text size="sm">End</Text>
        </HStack>
      </div>
    </div>
  ),
};
