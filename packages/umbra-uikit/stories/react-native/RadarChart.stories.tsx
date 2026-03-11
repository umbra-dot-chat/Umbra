import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RadarChart } from '@wisp-ui/react-native';
import { radarChartSizes } from '@wisp-ui/core/types/RadarChart.types';

const meta: Meta<typeof RadarChart> = {
  title: 'React Native/Components/Data Display/RadarChart',
  component: RadarChart,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...radarChartSizes] },
    max: { control: 'number' },
    levels: { control: 'number' },
    showLabels: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    showDots: { control: 'boolean' },
    fillOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
};

export default meta;
type Story = StoryObj<typeof RadarChart>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    axes: ['Speed', 'Power', 'Range', 'Durability', 'Precision'],
    series: [
      { label: 'Series 1', values: [90, 60, 80, 70, 95] },
      { label: 'Series 2', values: [70, 85, 60, 90, 50] },
      { label: 'Series 3', values: [50, 70, 90, 60, 75] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Single Series
// ---------------------------------------------------------------------------

export const SingleSeries: Story = {
  args: {
    size: 'lg',
    axes: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript'],
    series: [
      { label: 'Skills', values: [95, 90, 88, 85, 70, 92] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Multiple Series
// ---------------------------------------------------------------------------

export const MultipleSeries: Story = {
  args: {
    size: 'lg',
    axes: ['Strength', 'Speed', 'Intelligence', 'Endurance', 'Charisma'],
    series: [
      { label: 'Warrior', values: [95, 60, 40, 80, 50] },
      { label: 'Mage', values: [30, 50, 95, 40, 70] },
      { label: 'Rogue', values: [50, 95, 60, 50, 85] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Triangle
// ---------------------------------------------------------------------------

export const Triangle: Story = {
  args: {
    size: 'lg',
    axes: ['Design', 'Code', 'Strategy'],
    series: [
      { label: 'Profile', values: [85, 90, 70] },
    ],
    levels: 5,
  },
};
