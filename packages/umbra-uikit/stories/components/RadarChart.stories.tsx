import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RadarChart } from '@wisp-ui/react';
import { radarChartSizes } from '@wisp-ui/react';

const meta: Meta<typeof RadarChart> = {
  title: 'React/Components/Data Display/RadarChart',
  component: RadarChart,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: radarChartSizes },
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
// Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {radarChartSizes.map((size) => (
        <RadarChart
          key={size}
          size={size}
          axes={['A', 'B', 'C', 'D', 'E']}
          series={[{ label: 'Data', values: [80, 60, 70, 90, 50] }]}
        />
      ))}
    </div>
  ),
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
// Custom Colours
// ---------------------------------------------------------------------------

export const CustomColours: Story = {
  args: {
    size: 'lg',
    axes: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { label: '2024', values: [70, 85, 60, 90], color: '#FF6B6B' },
      { label: '2025', values: [80, 75, 85, 95], color: '#4ECDC4' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Triangle (3 axes)
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

// ---------------------------------------------------------------------------
// No Dots
// ---------------------------------------------------------------------------

export const NoDots: Story = {
  args: {
    size: 'lg',
    axes: ['A', 'B', 'C', 'D', 'E'],
    series: [
      { label: 'Alpha', values: [80, 65, 90, 55, 75] },
      { label: 'Beta', values: [60, 80, 50, 85, 70] },
    ],
    showDots: false,
    fillOpacity: 0.25,
  },
};

// ---------------------------------------------------------------------------
// Dense Fill
// ---------------------------------------------------------------------------

export const DenseFill: Story = {
  args: {
    size: 'lg',
    axes: ['Speed', 'Power', 'Range', 'Durability', 'Precision'],
    series: [
      { label: 'Hero', values: [90, 60, 80, 70, 95] },
    ],
    fillOpacity: 0.4,
    levels: 5,
  },
};
