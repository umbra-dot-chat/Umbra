import React from 'react';
import { RadarChart } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const radarChartEntry: ComponentEntry = {
  slug: 'radar-chart',
  name: 'RadarChart',
  category: 'components',
  subcategory: 'Data Viz',
  description:
    'Multi-axis radar (spider) chart for comparing one or more data series across categories. Features concentric polygon grids, axis labels, data-point dots, and a colour-coded legend.',
  variantCount: 4,
  keywords: ['chart', 'radar', 'spider', 'polygon', 'data', 'visualization', 'comparison', 'graph'],
  props: [
    { name: 'axes', type: 'string[]', required: true, description: 'Axis labels displayed around the perimeter.' },
    { name: 'series', type: 'RadarChartSeries[]', required: true, description: 'One or more data series to plot.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size variant controlling dimensions and fonts.' },
    { name: 'max', type: 'number', default: '100', description: 'Maximum value on each axis scale.' },
    { name: 'levels', type: 'number', default: '4', description: 'Number of concentric grid polygons.' },
    { name: 'showLabels', type: 'boolean', default: 'true', description: 'Show axis labels around the perimeter.' },
    { name: 'showLegend', type: 'boolean', default: 'true', description: 'Show colour-coded series legend.' },
    { name: 'showDots', type: 'boolean', default: 'true', description: 'Show dots at each data point.' },
    { name: 'fillOpacity', type: 'number', default: '0.15', description: 'Opacity of the area fill per series.' },
  ],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <RadarChart
        size="sm"
        axes={['A', 'B', 'C', 'D', 'E']}
        series={[
          { label: 'S1', values: [90, 60, 80, 70, 95] },
          { label: 'S2', values: [70, 85, 60, 90, 50] },
        ]}
        showLegend={false}
        showLabels={false}
      />
    </div>
  ),

  examples: [
    {
      title: 'Multiple Series',
      render: (
        <RadarChart
          size="lg"
          axes={['Speed', 'Power', 'Range', 'Durability', 'Precision']}
          series={[
            { label: 'Series 1', values: [90, 60, 80, 70, 95] },
            { label: 'Series 2', values: [70, 85, 60, 90, 50] },
            { label: 'Series 3', values: [50, 70, 90, 60, 75] },
          ]}
        />
      ),
      code: `import { RadarChart } from '@wisp-ui/react';

<RadarChart
  size="lg"
  axes={['Speed', 'Power', 'Range', 'Durability', 'Precision']}
  series={[
    { label: 'Series 1', values: [90, 60, 80, 70, 95] },
    { label: 'Series 2', values: [70, 85, 60, 90, 50] },
    { label: 'Series 3', values: [50, 70, 90, 60, 75] },
  ]}
/>`,
      rnCode: `import { RadarChart } from '@wisp-ui/react-native';

<RadarChart
  size="lg"
  axes={['Speed', 'Power', 'Range', 'Durability', 'Precision']}
  series={[
    { label: 'Series 1', values: [90, 60, 80, 70, 95] },
    { label: 'Series 2', values: [70, 85, 60, 90, 50] },
    { label: 'Series 3', values: [50, 70, 90, 60, 75] },
  ]}
/>`,
    },
    {
      title: 'Skills Profile',
      render: (
        <RadarChart
          size="lg"
          axes={['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript']}
          series={[
            { label: 'Skills', values: [95, 90, 88, 85, 70, 92] },
          ]}
          fillOpacity={0.25}
        />
      ),
      code: `import { RadarChart } from '@wisp-ui/react';

<RadarChart
  size="lg"
  axes={['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript']}
  series={[
    { label: 'Skills', values: [95, 90, 88, 85, 70, 92] },
  ]}
  fillOpacity={0.25}
/>`,
      rnCode: `import { RadarChart } from '@wisp-ui/react-native';

<RadarChart
  size="lg"
  axes={['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript']}
  series={[
    { label: 'Skills', values: [95, 90, 88, 85, 70, 92] },
  ]}
  fillOpacity={0.25}
/>`,
    },
    {
      title: 'Character Comparison',
      render: (
        <RadarChart
          size="lg"
          axes={['Strength', 'Speed', 'Intelligence', 'Endurance', 'Charisma']}
          series={[
            { label: 'Warrior', values: [95, 60, 40, 80, 50] },
            { label: 'Mage', values: [30, 50, 95, 40, 70] },
            { label: 'Rogue', values: [50, 95, 60, 50, 85] },
          ]}
        />
      ),
      code: `import { RadarChart } from '@wisp-ui/react';

<RadarChart
  size="lg"
  axes={['Strength', 'Speed', 'Intelligence', 'Endurance', 'Charisma']}
  series={[
    { label: 'Warrior', values: [95, 60, 40, 80, 50] },
    { label: 'Mage', values: [30, 50, 95, 40, 70] },
    { label: 'Rogue', values: [50, 95, 60, 50, 85] },
  ]}
/>`,
      rnCode: `import { RadarChart } from '@wisp-ui/react-native';

<RadarChart
  size="lg"
  axes={['Strength', 'Speed', 'Intelligence', 'Endurance', 'Charisma']}
  series={[
    { label: 'Warrior', values: [95, 60, 40, 80, 50] },
    { label: 'Mage', values: [30, 50, 95, 40, 70] },
    { label: 'Rogue', values: [50, 95, 60, 50, 85] },
  ]}
/>`,
    },
    {
      title: 'Custom Colours & Dense Fill',
      render: (
        <RadarChart
          size="lg"
          axes={['Q1', 'Q2', 'Q3', 'Q4']}
          series={[
            { label: '2024', values: [70, 85, 60, 90], color: '#FF6B6B' },
            { label: '2025', values: [80, 75, 85, 95], color: '#4ECDC4' },
          ]}
          fillOpacity={0.3}
          levels={5}
        />
      ),
      code: `import { RadarChart } from '@wisp-ui/react';

<RadarChart
  size="lg"
  axes={['Q1', 'Q2', 'Q3', 'Q4']}
  series={[
    { label: '2024', values: [70, 85, 60, 90], color: '#FF6B6B' },
    { label: '2025', values: [80, 75, 85, 95], color: '#4ECDC4' },
  ]}
  fillOpacity={0.3}
  levels={5}
/>`,
      rnCode: `import { RadarChart } from '@wisp-ui/react-native';

<RadarChart
  size="lg"
  axes={['Q1', 'Q2', 'Q3', 'Q4']}
  series={[
    { label: '2024', values: [70, 85, 60, 90], color: '#FF6B6B' },
    { label: '2025', values: [80, 75, 85, 95], color: '#4ECDC4' },
  ]}
  fillOpacity={0.3}
  levels={5}
/>`,
    },
  ],
};
