import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Container, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Container> = {
  title: 'React Native/Layouts/Container',
  component: Container,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    center: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    size: 'lg',
    center: true,
  },
  render: (args) => (
    <div style={{ width: '100%', background: '#F3F4F8', padding: 16 }}>
      <Container {...args}>
        <div style={{ background: '#E2E8F0', borderRadius: 6, padding: 16 }}>
          <Text size="sm">Content inside a container</Text>
        </div>
      </Container>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Container size presets</div>
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ background: '#F3F4F8', padding: 8 }}>
          <Container size={size}>
            <div style={{ background: '#E2E8F0', borderRadius: 6, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text size="sm">{size}</Text>
              <span style={{ fontSize: 10, color: '#94A0B8' }}>
                {size === 'sm' && '640px'}
                {size === 'md' && '768px'}
                {size === 'lg' && '1024px'}
                {size === 'xl' && '1280px'}
              </span>
            </div>
          </Container>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Centered
// ---------------------------------------------------------------------------

export const Centered: Story = {
  name: 'Centered',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>center=true (default)</div>
        <div style={{ background: '#F3F4F8', padding: 8 }}>
          <Container size="sm" center>
            <div style={{ background: '#E2E8F0', borderRadius: 6, padding: 12 }}>
              <Text size="sm">Centered container</Text>
            </div>
          </Container>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>center=false</div>
        <div style={{ background: '#F3F4F8', padding: 8 }}>
          <Container size="sm" center={false}>
            <div style={{ background: '#E2E8F0', borderRadius: 6, padding: 12 }}>
              <Text size="sm">Left-aligned container</Text>
            </div>
          </Container>
        </div>
      </div>
    </div>
  ),
};
