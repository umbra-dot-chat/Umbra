import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { componentSizes, thicknesses } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Progress> = {
  title: 'React/Primitives/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: 'number' },
    size: { control: 'select', options: [...componentSizes] },
    label: { control: 'text' },
    showValue: { control: 'boolean' },
    color: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info'] },
    indeterminate: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

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
    value: 45,
    max: 100,
    size: 'md',
    color: 'default',
  },
  render: (args) => (
    <div style={{ maxWidth: 400 }}>
      <Progress {...args} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Sizes — all 5
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>All sizes</SectionLabel>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text size="xs" color="tertiary">{size}</Text>
          <Progress size={size} value={60} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Progress with label</SectionLabel>
      <Progress value={30} label="Uploading files..." size="sm" />
      <Progress value={65} label="Processing" size="md" />
      <Progress value={90} label="Almost done" size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Value — showValue
// ---------------------------------------------------------------------------

export const WithValue: Story = {
  name: 'With Value',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Progress with value display</SectionLabel>
      <Progress value={25} showValue size="sm" />
      <Progress value={50} showValue size="md" />
      <Progress value={75} showValue label="Download" size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Color Variants
// ---------------------------------------------------------------------------

export const ColorVariants: Story = {
  name: 'Color Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Color variants</SectionLabel>
      {(['default', 'success', 'warning', 'danger', 'info'] as const).map((color) => (
        <div key={color} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text size="xs" color="tertiary">{color}</Text>
          <Progress value={65} color={color} size="md" />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Custom Format
// ---------------------------------------------------------------------------

export const CustomFormat: Story = {
  name: 'Custom Format',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Custom value formatting</SectionLabel>
      <Progress
        value={750}
        max={1000}
        showValue
        label="Storage"
        formatValue={(v, m) => `${v} / ${m} MB`}
      />
      <Progress
        value={3}
        max={5}
        showValue
        label="Steps completed"
        formatValue={(v, m) => `${v} of ${m}`}
      />
      <Progress
        value={42}
        max={100}
        showValue
        label="Battery"
        formatValue={(v) => `${v}%  remaining`}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Indeterminate
// ---------------------------------------------------------------------------

export const Indeterminate: Story = {
  name: 'Indeterminate',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Indeterminate mode</SectionLabel>
      <Progress indeterminate size="sm" />
      <Progress indeterminate size="md" label="Loading..." />
      <Progress indeterminate size="lg" color="info" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Thickness — override bar height with shared token
// ---------------------------------------------------------------------------

export const Thickness: Story = {
  name: 'Thickness',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Thickness overrides</SectionLabel>
      {(['thin', 'regular', 'medium', 'thick', 'heavy'] as const).map((t) => (
        <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text size="xs" color="tertiary">{t}</Text>
          <Progress value={60} thickness={t} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>Skeleton loading</SectionLabel>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Progress key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Composition — multiple progress bars in a card-like container
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 420 }}>
      <SectionLabel>Storage usage</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Progress
          value={82}
          label="Documents"
          showValue
          color="default"
          size="sm"
          formatValue={(v) => `${v}%`}
        />
        <Progress
          value={45}
          label="Photos"
          showValue
          color="info"
          size="sm"
          formatValue={(v) => `${v}%`}
        />
        <Progress
          value={91}
          label="Backups"
          showValue
          color="warning"
          size="sm"
          formatValue={(v) => `${v}%`}
        />
        <Progress
          value={98}
          label="System"
          showValue
          color="danger"
          size="sm"
          formatValue={(v) => `${v}%`}
        />
      </div>

      <Progress
        value={79}
        label="Total (79 / 100 GB)"
        showValue
        color="default"
        size="md"
      />

      <div style={{ height: 8 }} />
      <SectionLabel>Task progress</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Progress
          value={8}
          max={12}
          label="Completed tasks"
          showValue
          color="success"
          size="md"
          formatValue={(v, m) => `${v} / ${m}`}
        />
        <Progress
          value={3}
          max={12}
          label="In review"
          showValue
          color="info"
          size="sm"
          formatValue={(v, m) => `${v} / ${m}`}
        />
        <Progress
          value={1}
          max={12}
          label="Blocked"
          showValue
          color="danger"
          size="sm"
          formatValue={(v, m) => `${v} / ${m}`}
        />
      </div>
    </div>
  ),
};
