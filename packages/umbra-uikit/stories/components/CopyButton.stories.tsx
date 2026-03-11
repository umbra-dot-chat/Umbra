/**
 * CopyButton -- Stories showing all variants, sizes, and states.
 *
 * @module stories/copy-button
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CopyButton } from '@wisp-ui/react';

const meta: Meta<typeof CopyButton> = {
  title: 'React/Components/Utilities/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['outline', 'ghost', 'minimal'] },
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    value: 'npm install @wisp/ui',
  },
};

// ---------------------------------------------------------------------------
// WithLabel
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'WithLabel',
  args: {
    value: 'npm install @wisp/ui',
    label: 'Copy',
  },
};

// ---------------------------------------------------------------------------
// Ghost
// ---------------------------------------------------------------------------

export const Ghost: Story = {
  name: 'Ghost',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <CopyButton value="ghost-value" variant="ghost" />
      <CopyButton value="ghost-value" variant="ghost" label="Copy" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Minimal
// ---------------------------------------------------------------------------

export const Minimal: Story = {
  name: 'Minimal',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <CopyButton value="minimal-value" variant="minimal" size="sm" />
      <CopyButton value="minimal-value" variant="minimal" size="md" />
      <CopyButton value="minimal-value" variant="minimal" size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'AllSizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <CopyButton value={`size-${size}`} size={size} />
          <CopyButton value={`size-${size}`} size={size} label="Copy" />
          <CopyButton value={`size-${size}`} size={size} variant="ghost" label="Copy" />
          <CopyButton value={`size-${size}`} size={size} variant="minimal" />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <CopyButton value="disabled-outline" disabled />
      <CopyButton value="disabled-label" disabled label="Copy" />
      <CopyButton value="disabled-ghost" disabled variant="ghost" label="Copy" />
      <CopyButton value="disabled-minimal" disabled variant="minimal" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Custom Duration
// ---------------------------------------------------------------------------

export const CustomDuration: Story = {
  name: 'CustomDuration',
  args: {
    value: 'custom-duration-value',
    label: 'Copy (5s)',
    copiedDuration: 5000,
    copiedLabel: 'Done!',
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CopyButton value="" skeleton size="sm" />
      <CopyButton value="" skeleton size="md" />
      <CopyButton value="" skeleton size="lg" />
    </div>
  ),
};
