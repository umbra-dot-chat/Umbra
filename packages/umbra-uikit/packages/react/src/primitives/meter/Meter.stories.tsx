import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Meter } from './Meter';
import { Text } from '../text';
import { meterSizes, meterVariants } from '@coexist/wisp-core/types/Meter.types';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Meter> = {
  title: 'Primitives/Meter',
  component: Meter,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    min: { control: 'number' },
    max: { control: 'number' },
    size: { control: 'select', options: [...meterSizes] },
    label: { control: 'text' },
    showValue: { control: 'boolean' },
    variant: { control: 'select', options: [...meterVariants] },
    segments: { control: 'number' },
    optimum: { control: 'number' },
    low: { control: 'number' },
    high: { control: 'number' },
    skeleton: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Meter>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default -- playground with value slider
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  args: {
    value: 45,
    min: 0,
    max: 100,
    size: 'md',
    variant: 'default',
  },
  render: (args) => (
    <div style={{ maxWidth: 400 }}>
      <Meter {...args} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. WithLabel -- meter with label and value display
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Meter with label</SectionLabel>
      <Meter value={30} label="Disk usage" showValue size="sm" />
      <Meter value={65} label="Memory" showValue size="md" />
      <Meter value={90} label="CPU load" showValue size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Gradient -- gradient variant
// ---------------------------------------------------------------------------

export const Gradient: Story = {
  name: 'Gradient',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Gradient variant</SectionLabel>
      <Meter value={25} variant="gradient" label="Low" showValue size="sm" />
      <Meter value={55} variant="gradient" label="Medium" showValue size="md" />
      <Meter value={85} variant="gradient" label="High" showValue size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Segments -- semantic green/yellow/red colouring
// ---------------------------------------------------------------------------

export const Segments: Story = {
  name: 'Segments',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Segments variant (optimum low)</SectionLabel>
      <Meter value={15} variant="segments" low={25} high={75} optimum={10} label="Good (low)" showValue />
      <Meter value={50} variant="segments" low={25} high={75} optimum={10} label="OK (mid)" showValue />
      <Meter value={85} variant="segments" low={25} high={75} optimum={10} label="Bad (high)" showValue />

      <SectionLabel>Segments variant (optimum high)</SectionLabel>
      <Meter value={15} variant="segments" low={25} high={75} optimum={90} label="Bad (low)" showValue />
      <Meter value={50} variant="segments" low={25} high={75} optimum={90} label="OK (mid)" showValue />
      <Meter value={85} variant="segments" low={25} high={75} optimum={90} label="Good (high)" showValue />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. AllSizes -- all 3 sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>All sizes</SectionLabel>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text size="xs" color="tertiary">{size}</Text>
          <Meter size={size} value={60} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Skeleton -- skeleton loading states
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Skeleton loading</SectionLabel>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Meter key={size} skeleton size={size} value={0} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. LowValue -- meter with low value
// ---------------------------------------------------------------------------

export const LowValue: Story = {
  name: 'Low Value',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Low values</SectionLabel>
      <Meter value={5} label="Battery" showValue />
      <Meter value={10} variant="segments" low={25} high={75} optimum={90} label="Signal strength" showValue />
      <Meter value={2} variant="gradient" label="Storage remaining" showValue />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. HighValue -- meter with high value
// ---------------------------------------------------------------------------

export const HighValue: Story = {
  name: 'High Value',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>High values</SectionLabel>
      <Meter value={95} label="Disk usage" showValue />
      <Meter value={98} variant="segments" low={25} high={75} optimum={10} label="CPU temperature" showValue />
      <Meter value={92} variant="gradient" label="Memory" showValue />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Disabled -- dimmed non-interactive meter
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Disabled meters</SectionLabel>
      <Meter value={60} label="Storage" showValue disabled />
      <Meter value={35} variant="gradient" label="Bandwidth" showValue disabled />
      <Meter value={80} variant="segments" low={25} high={75} optimum={90} label="Signal" showValue disabled />
    </div>
  ),
};
