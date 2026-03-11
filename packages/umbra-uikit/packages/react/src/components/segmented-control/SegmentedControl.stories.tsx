import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SegmentedControl } from './SegmentedControl';
import { Text } from '../../primitives/text';
import { Icon } from '../../primitives/icon';
import { Grid, List, LayoutGrid } from 'lucide-react';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

export const Default: Story = {
  args: {
    options: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
    ],
    defaultValue: 'weekly',
  },
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
      { value: 'c', label: 'Option C' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size}>
            <SectionLabel>{size}</SectionLabel>
            <SegmentedControl options={options} defaultValue="a" size={size} />
          </div>
        ))}
      </div>
    );
  },
};

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <SegmentedControl
      defaultValue="grid"
      options={[
        { value: 'grid', label: 'Grid', icon: <Icon icon={Grid} size="xs" /> },
        { value: 'list', label: 'List', icon: <Icon icon={List} size="xs" /> },
        { value: 'board', label: 'Board', icon: <Icon icon={LayoutGrid} size="xs" /> },
      ]}
    />
  ),
};

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <SegmentedControl
        fullWidth
        defaultValue="all"
        options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ]}
      />
    </div>
  ),
};

export const DisabledOptions: Story = {
  name: 'Disabled Options',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <SectionLabel>Single disabled option</SectionLabel>
        <SegmentedControl
          defaultValue="on"
          options={[
            { value: 'on', label: 'On' },
            { value: 'off', label: 'Off' },
            { value: 'auto', label: 'Auto', disabled: true },
          ]}
        />
      </div>
      <div>
        <SectionLabel>Entire control disabled</SectionLabel>
        <SegmentedControl
          disabled
          defaultValue="on"
          options={[
            { value: 'on', label: 'On' },
            { value: 'off', label: 'Off' },
            { value: 'auto', label: 'Auto' },
          ]}
        />
      </div>
    </div>
  ),
};

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <SectionLabel>View mode selector</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text size="sm" weight="semibold">View</Text>
        <SegmentedControl
          size="sm"
          defaultValue="grid"
          options={[
            { value: 'grid', label: 'Grid', icon: <Icon icon={Grid} size="xs" /> },
            { value: 'list', label: 'List', icon: <Icon icon={List} size="xs" /> },
          ]}
        />
      </div>
    </div>
  ),
};
