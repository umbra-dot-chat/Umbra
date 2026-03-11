import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ActivityCircles, Text } from '@wisp-ui/react';
import { activityCirclesSizes } from '@wisp-ui/react';

const meta: Meta<typeof ActivityCircles> = {
  title: 'React/Components/Data Display/ActivityCircles',
  component: ActivityCircles,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: activityCirclesSizes },
    showLabels: { control: 'boolean' },
    animated: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityCircles>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    rings: [
      { value: 75, max: 100, label: 'Move' },
      { value: 42, max: 60, label: 'Exercise' },
      { value: 10, max: 12, label: 'Stand' },
    ],
    showLabels: true,
  },
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {activityCirclesSizes.map((size) => (
        <ActivityCircles
          key={size}
          size={size}
          rings={[
            { value: 80, max: 100 },
            { value: 45, max: 60 },
            { value: 9, max: 12 },
          ]}
        />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Labels
// ---------------------------------------------------------------------------

export const WithLabels: Story = {
  args: {
    size: 'lg',
    showLabels: true,
    rings: [
      { value: 520, max: 600, label: 'Move' },
      { value: 28, max: 30, label: 'Exercise' },
      { value: 11, max: 12, label: 'Stand' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Custom Colours
// ---------------------------------------------------------------------------

export const CustomColours: Story = {
  args: {
    size: 'lg',
    showLabels: true,
    rings: [
      { value: 90, max: 100, color: '#FF3B30', label: 'Calories' },
      { value: 65, max: 100, color: '#30D158', label: 'Steps' },
      { value: 40, max: 100, color: '#007AFF', label: 'Distance' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Centre Content
// ---------------------------------------------------------------------------

export const CentreContent: Story = {
  args: {
    size: 'xl',
    rings: [
      { value: 75, max: 100 },
      { value: 50, max: 100 },
      { value: 30, max: 100 },
    ],
  },
  render: (args) => (
    <ActivityCircles {...args}>
      <div style={{ textAlign: 'center' }}>
        <Text weight="bold" size="lg">1,000</Text>
        <Text size="sm" color="muted">Active users</Text>
      </div>
    </ActivityCircles>
  ),
};

// ---------------------------------------------------------------------------
// Single Ring
// ---------------------------------------------------------------------------

export const SingleRing: Story = {
  args: {
    size: 'lg',
    showLabels: true,
    rings: [
      { value: 72, max: 100, label: 'Progress' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Five Rings
// ---------------------------------------------------------------------------

export const FiveRings: Story = {
  args: {
    size: 'xl',
    showLabels: true,
    rings: [
      { value: 95, max: 100, label: 'Speed' },
      { value: 70, max: 100, label: 'Power' },
      { value: 85, max: 100, label: 'Range' },
      { value: 60, max: 100, label: 'Durability' },
      { value: 45, max: 100, label: 'Precision' },
    ],
  },
};
