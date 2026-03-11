import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StorageUsageViz } from './StorageUsageViz';
import type { StorageBar } from '@coexist/wisp-core/types/StorageUsageViz.types';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof StorageUsageViz> = {
  title: 'Components/Community/StorageUsageViz',
  component: StorageUsageViz,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    showLegend: { control: 'boolean' },
    height: { control: 'number' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof StorageUsageViz>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleBars: StorageBar[] = [
  { label: 'Home Server', usedBytes: 53687091200, totalBytes: 107374182400 },
  { label: 'Cloud VPS', usedBytes: 107374182400, totalBytes: 536870912000, color: '#8b5cf6' },
  { label: 'Raspberry Pi', usedBytes: 30064771072, totalBytes: 32212254720, color: '#f59e0b' },
  { label: 'NAS Drive', usedBytes: 214748364800, totalBytes: 1099511627776, color: '#06b6d4' },
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    bars: sampleBars,
  },
};

export const CustomTitle: Story = {
  name: 'Custom Title',
  args: {
    bars: sampleBars,
    title: 'Node Storage Overview',
  },
};

export const NoLegend: Story = {
  name: 'Without Legend',
  args: {
    bars: sampleBars,
    showLegend: false,
  },
};

export const TallChart: Story = {
  name: 'Tall Chart',
  args: {
    bars: sampleBars,
    height: 400,
  },
};

export const SingleBar: Story = {
  name: 'Single Bar',
  args: {
    bars: [sampleBars[0]],
  },
};

export const FullStorage: Story = {
  name: 'Near Full',
  args: {
    bars: [
      { label: 'Almost Full', usedBytes: 9663676416, totalBytes: 10737418240, color: '#ef4444' },
      { label: 'Full', usedBytes: 10737418240, totalBytes: 10737418240, color: '#dc2626' },
    ],
    title: 'Critical Storage',
  },
};

export const Skeleton: Story = {
  args: {
    bars: [],
    skeleton: true,
  },
};
