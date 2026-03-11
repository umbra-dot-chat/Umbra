import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CircularProgress } from './CircularProgress';
import { Text } from '../text';
import { circularProgressSizes, circularProgressVariants } from '@coexist/wisp-core/types/CircularProgress.types';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof CircularProgress> = {
  title: 'Primitives/CircularProgress',
  component: CircularProgress,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: 'number' },
    size: { control: 'select', options: [...circularProgressSizes] },
    variant: { control: 'select', options: [...circularProgressVariants] },
    showValue: { control: 'boolean' },
    color: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info'] },
    indeterminate: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof CircularProgress>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default — playground with value slider
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  args: {
    value: 75,
    max: 100,
    size: 'md',
    color: 'default',
    showValue: true,
  },
  render: (args) => (
    <div style={{ padding: 24 }}>
      <CircularProgress {...args} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Sizes — all 4
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <SectionLabel>All sizes</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'end', gap: 24 }}>
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <CircularProgress size={size} value={65} showValue />
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. HalfCircle — gauge at 60%
// ---------------------------------------------------------------------------

export const HalfCircle: Story = {
  name: 'Half Circle (Gauge)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <SectionLabel>Half-circle gauge variant</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'end', gap: 24 }}>
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <CircularProgress size={size} value={60} variant="half" showValue />
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Colors — success/warning/danger/info
// ---------------------------------------------------------------------------

export const Colors: Story = {
  name: 'Color Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <SectionLabel>Color variants</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'end', gap: 24 }}>
        {(['default', 'success', 'warning', 'danger', 'info'] as const).map((color) => (
          <div key={color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <CircularProgress size="lg" value={72} color={color} showValue />
            <Text size="xs" color="tertiary">{color}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. WithLabel — label below the ring
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <SectionLabel>With labels</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'start', gap: 32 }}>
        <CircularProgress size="lg" value={45} showValue label="Upload" color="info" />
        <CircularProgress size="lg" value={78} showValue label="Memory" color="warning" />
        <CircularProgress size="lg" value={92} showValue label="Disk" color="danger" />
        <CircularProgress size="lg" value={33} showValue label="CPU" color="success" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. WithCustomContent — children in center (e.g. icon or custom text)
// ---------------------------------------------------------------------------

export const WithCustomContent: Story = {
  name: 'With Custom Content',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <SectionLabel>Custom center content</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'start', gap: 32 }}>
        <CircularProgress size="xl" value={85} color="success" label="Health">
          <span style={{ fontSize: 24 }}>{'+'}</span>
        </CircularProgress>

        <CircularProgress size="xl" value={42} color="info" label="Progress">
          <span style={{ fontSize: 14, fontWeight: 600 }}>42/100</span>
        </CircularProgress>

        <CircularProgress size="xl" value={100} color="success" label="Done">
          <span style={{ fontSize: 20 }}>{'OK'}</span>
        </CircularProgress>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Thickness — override stroke width with shared token
// ---------------------------------------------------------------------------

export const Thickness: Story = {
  name: 'Thickness',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <SectionLabel>Thickness overrides</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'end', gap: 24 }}>
        {(['thin', 'regular', 'medium', 'thick', 'heavy'] as const).map((t) => (
          <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <CircularProgress size="lg" value={65} thickness={t} showValue />
            <Text size="xs" color="tertiary">{t}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Indeterminate — spinning
// ---------------------------------------------------------------------------

export const Indeterminate: Story = {
  name: 'Indeterminate',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <SectionLabel>Indeterminate mode</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'end', gap: 24 }}>
        <CircularProgress size="sm" indeterminate />
        <CircularProgress size="md" indeterminate label="Loading" />
        <CircularProgress size="lg" indeterminate color="info" />
        <CircularProgress size="xl" indeterminate color="success" label="Processing" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Composition — dashboard gauge panel
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, maxWidth: 560 }}>
      <SectionLabel>System dashboard</SectionLabel>

      {/* Row of full-circle gauges */}
      <div style={{ display: 'flex', gap: 32, justifyContent: 'space-around' }}>
        <CircularProgress
          size="xl"
          value={73}
          color="info"
          showValue
          label="CPU"
        />
        <CircularProgress
          size="xl"
          value={89}
          color="warning"
          showValue
          label="Memory"
        />
        <CircularProgress
          size="xl"
          value={45}
          color="success"
          showValue
          label="Network"
        />
        <CircularProgress
          size="xl"
          value={96}
          color="danger"
          showValue
          label="Disk"
        />
      </div>

      {/* Half-circle gauge row */}
      <div style={{ height: 8 }} />
      <SectionLabel>Half-circle gauges</SectionLabel>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'space-around' }}>
        <CircularProgress
          size="xl"
          value={62}
          variant="half"
          color="info"
          showValue
          label="Temperature"
          formatValue={(v) => `${v}C`}
        />
        <CircularProgress
          size="xl"
          value={1200}
          max={3000}
          variant="half"
          color="warning"
          showValue
          label="RPM"
          formatValue={(v) => `${v}`}
        />
        <CircularProgress
          size="xl"
          value={8}
          max={10}
          variant="half"
          color="success"
          showValue
          label="Score"
          formatValue={(v, m) => `${v}/${m}`}
        />
      </div>

      {/* Mixed composition */}
      <div style={{ height: 8 }} />
      <SectionLabel>Task progress</SectionLabel>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <CircularProgress
          size="lg"
          value={7}
          max={10}
          color="success"
          label="Complete"
          formatValue={(v, m) => `${v}/${m}`}
          showValue
        />
        <CircularProgress
          size="lg"
          value={2}
          max={10}
          color="info"
          label="In review"
          formatValue={(v, m) => `${v}/${m}`}
          showValue
        />
        <CircularProgress
          size="lg"
          value={1}
          max={10}
          color="danger"
          label="Blocked"
          formatValue={(v, m) => `${v}/${m}`}
          showValue
        />
        <CircularProgress
          size="md"
          indeterminate
          color="info"
          label="Syncing"
        />
      </div>
    </div>
  ),
};
