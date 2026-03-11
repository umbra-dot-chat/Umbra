import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';
import { Text } from '../text';

const meta: Meta<typeof Skeleton> = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['text', 'circular', 'rectangular'] },
    animation: { control: 'select', options: ['pulse', 'wave', 'none'] },
    width: { control: 'text' },
    height: { control: 'text' },
    lines: { control: 'number' },
    lineHeight: { control: 'number' },
    lineSpacing: { control: 'number' },
    radius: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

export const Default: Story = {
  name: 'Default',
  render: (args) => <Skeleton {...args} />,
};

export const TextLines: Story = {
  name: 'Text Lines',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      <SectionLabel>1 line</SectionLabel>
      <Skeleton variant="text" lines={1} />
      <SectionLabel>3 lines (default)</SectionLabel>
      <Skeleton variant="text" lines={3} />
      <SectionLabel>5 lines</SectionLabel>
      <Skeleton variant="text" lines={5} />
    </div>
  ),
};

export const Circular: Story = {
  name: 'Circular',
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton variant="circular" width={64} height={64} />
      <Skeleton variant="circular" width={96} height={96} />
    </div>
  ),
};

export const Rectangular: Story = {
  name: 'Rectangular',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Skeleton variant="rectangular" width={200} height={20} />
      <Skeleton variant="rectangular" width={300} height={120} />
      <Skeleton variant="rectangular" width="100%" height={200} radius={16} />
    </div>
  ),
};

export const Animations: Story = {
  name: 'Animations',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>Pulse (default)</SectionLabel>
      <Skeleton variant="rectangular" width={300} height={48} animation="pulse" />
      <SectionLabel>Wave</SectionLabel>
      <Skeleton variant="rectangular" width={300} height={48} animation="wave" />
      <SectionLabel>None</SectionLabel>
      <Skeleton variant="rectangular" width={300} height={48} animation="none" />
    </div>
  ),
};

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        borderRadius: 12,
        border: '1px solid #202531',
        maxWidth: 360,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton variant="circular" width={48} height={48} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton variant="text" lines={1} width="60%" />
          <Skeleton variant="text" lines={1} width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={120} />
      <Skeleton variant="text" lines={3} />
      <Skeleton variant="rectangular" width={100} height={36} radius={8} />
    </div>
  ),
};
