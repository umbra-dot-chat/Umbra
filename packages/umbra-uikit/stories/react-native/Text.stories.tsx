import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Text> = {
  title: 'React Native/Primitives/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'display-xs', 'display-sm', 'display-md', 'display-lg', 'display-xl', 'display-2xl'],
    },
    weight: { control: 'select', options: ['regular', 'medium', 'semibold', 'bold'] },
    color: { control: 'select', options: ['primary', 'secondary', 'tertiary', 'muted', 'inverse', 'error', 'warning', 'success', 'info', 'link'] },
    align: { control: 'select', options: ['left', 'center', 'right', 'justify'] },
    truncate: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'Hello from React Native Text',
    size: 'md',
    weight: 'regular',
    color: 'primary',
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl', 'display-xs', 'display-sm', 'display-md', 'display-lg', 'display-xl', 'display-2xl'] as const).map((size) => (
        <Text key={size} size={size} color="primary">
          {size} — The quick brown fox
        </Text>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Weights
// ---------------------------------------------------------------------------

export const Weights: Story = {
  name: 'Weights',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['regular', 'medium', 'semibold', 'bold'] as const).map((weight) => (
        <Text key={weight} size="lg" weight={weight} color="primary">
          {weight} — The quick brown fox
        </Text>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Colors
// ---------------------------------------------------------------------------

export const Colors: Story = {
  name: 'Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['primary', 'secondary', 'tertiary', 'muted', 'error', 'warning', 'success', 'info', 'link'] as const).map((color) => (
        <Text key={color} size="md" weight="medium" color={color}>
          {color} — The quick brown fox jumps over the lazy dog
        </Text>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Truncation
// ---------------------------------------------------------------------------

export const Truncation: Story = {
  name: 'Truncation',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300 }}>
      <Text size="md" color="primary" truncate>
        This is a very long text that should be truncated to a single line with an ellipsis at the end
      </Text>
      <Text size="md" color="primary" maxLines={2}>
        This text has maxLines set to 2 so it will show up to two lines before being clipped with an ellipsis. This sentence keeps going to demonstrate the clamping behavior.
      </Text>
      <Text size="md" color="primary" maxLines={3}>
        Three lines max. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
      </Text>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Alignment
// ---------------------------------------------------------------------------

export const Alignment: Story = {
  name: 'Alignment',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 400 }}>
      <Text size="md" color="primary" align="left">Left aligned text</Text>
      <Text size="md" color="primary" align="center">Center aligned text</Text>
      <Text size="md" color="primary" align="right">Right aligned text</Text>
    </div>
  ),
};
