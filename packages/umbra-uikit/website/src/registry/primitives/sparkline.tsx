import React from 'react';
import { Sparkline, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const sampleData = [4, 7, 5, 9, 6, 8, 3, 7, 10, 6, 8, 5, 9, 7];
const uptrend = [2, 3, 4, 3, 5, 6, 5, 7, 8, 9, 8, 10, 11, 12];
const downtrend = [12, 11, 10, 9, 10, 8, 7, 8, 6, 5, 4, 5, 3, 2];
const flatData = [5, 5, 5, 5, 5, 5, 5, 5];

export const sparklineEntry: ComponentEntry = {
  slug: 'sparkline',
  name: 'Sparkline',
  category: 'primitives',
  subcategory: 'Media & Display',
  description:
    'Tiny inline SVG chart for embedding in tables, cards, and dashboards. Supports line, area, and bar chart types with smooth curves, end dots, and entry animation.',
  variantCount: 3,
  keywords: ['sparkline', 'chart', 'graph', 'line', 'area', 'bar', 'inline', 'micro', 'mini', 'trend', 'data', 'visualization'],

  cardPreview: (
    <HStack gap="md" style={{ alignItems: 'center', pointerEvents: 'none' }}>
      <Sparkline data={uptrend} color="success" size="md" showEndDot />
      <Sparkline data={downtrend} color="danger" variant="area" size="md" />
      <Sparkline data={sampleData} variant="bar" size="md" color="info" />
    </HStack>
  ),

  examples: [
    {
      title: 'Chart Types',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} variant="line" size="lg" />
            <Text size="xs" color="secondary">Line</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} variant="area" size="lg" />
            <Text size="xs" color="secondary">Area</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} variant="bar" size="lg" />
            <Text size="xs" color="secondary">Bar</Text>
          </VStack>
        </HStack>
      ),
      code: `import { Sparkline } from '@wisp-ui/react';

const data = [4, 7, 5, 9, 6, 8, 3, 7, 10, 6];

<Sparkline data={data} variant="line" />
<Sparkline data={data} variant="area" />
<Sparkline data={data} variant="bar" />`,
    },
    {
      title: 'Colors',
      render: (
        <HStack gap="lg" style={{ alignItems: 'center' }}>
          <Sparkline data={uptrend} color="default" size="lg" showEndDot />
          <Sparkline data={uptrend} color="success" size="lg" showEndDot />
          <Sparkline data={sampleData} color="warning" size="lg" showEndDot />
          <Sparkline data={downtrend} color="danger" size="lg" showEndDot />
          <Sparkline data={sampleData} color="info" size="lg" showEndDot />
        </HStack>
      ),
      code: `<Sparkline data={data} color="success" showEndDot />
<Sparkline data={data} color="warning" showEndDot />
<Sparkline data={data} color="danger" showEndDot />
<Sparkline data={data} color="info" showEndDot />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="lg" style={{ alignItems: 'flex-end' }}>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} size="sm" variant="area" color="info" />
            <Text size="xs" color="secondary">sm</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} size="md" variant="area" color="info" />
            <Text size="xs" color="secondary">md</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} size="lg" variant="area" color="info" />
            <Text size="xs" color="secondary">lg</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} size="xl" variant="area" color="info" />
            <Text size="xs" color="secondary">xl</Text>
          </VStack>
        </HStack>
      ),
      code: `<Sparkline data={data} size="sm" />
<Sparkline data={data} size="md" />
<Sparkline data={data} size="lg" />
<Sparkline data={data} size="xl" />`,
    },
    {
      title: 'Curved vs Straight',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} size="lg" curved showEndDot />
            <Text size="xs" color="secondary">Curved</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <Sparkline data={sampleData} size="lg" curved={false} showEndDot />
            <Text size="xs" color="secondary">Straight</Text>
          </VStack>
        </HStack>
      ),
      code: `<Sparkline data={data} curved />
<Sparkline data={data} curved={false} />`,
    },
    {
      title: 'Animated Entry',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <Sparkline data={uptrend} size="xl" color="success" animated showEndDot />
          <Sparkline data={sampleData} variant="area" size="xl" color="info" animated />
          <Sparkline data={sampleData} variant="bar" size="xl" color="warning" animated />
        </HStack>
      ),
      code: `<Sparkline data={data} animated showEndDot />
<Sparkline data={data} variant="area" animated />
<Sparkline data={data} variant="bar" animated />`,
    },
    {
      title: 'Responsive Width',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Sparkline data={uptrend} variant="area" color="success" responsive size="lg" showEndDot />
        </div>
      ),
      code: `<div style={{ width: '100%' }}>
  <Sparkline data={data} responsive variant="area" color="success" showEndDot />
</div>`,
    },
    {
      title: 'Skeleton',
      render: (
        <HStack gap="lg" style={{ alignItems: 'center' }}>
          <Sparkline data={[]} size="md" skeleton />
          <Sparkline data={[]} size="lg" skeleton />
          <Sparkline data={[]} size="xl" skeleton />
        </HStack>
      ),
      code: `<Sparkline data={[]} skeleton />`,
    },
  ],

  props: [
    { name: 'data', type: 'number[]', required: true, description: 'Array of numeric values to plot.' },
    { name: 'variant', type: "'line' | 'area' | 'bar'", default: "'line'", description: 'Chart type.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Preset dimensions.' },
    { name: 'color', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Accent color.' },
    { name: 'curved', type: 'boolean', default: 'true', description: 'Use smooth cubic-bezier curves instead of straight segments.' },
    { name: 'showEndDot', type: 'boolean', default: 'false', description: 'Show a highlighted dot on the last data point.' },
    { name: 'animated', type: 'boolean', default: 'false', description: 'Animate the chart entry.' },
    { name: 'fillOpacity', type: 'number', default: '0.15', description: 'Opacity of the fill gradient for area variant (0-1).' },
    { name: 'responsive', type: 'boolean', default: 'false', description: 'Stretch width to 100% of parent container.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show a loading skeleton placeholder.' },
  ],
};
