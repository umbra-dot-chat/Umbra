/**
 * ButtonGroup — Stories showing all variants, sizes, and usage patterns.
 *
 * @module stories/button-group
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonGroup } from '@wisp-ui/react';
import { List, Grid, LayoutGrid } from 'lucide-react';

const meta: Meta<typeof ButtonGroup> = {
  title: 'React/Components/Utilities/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    items: [
      { value: 'all', label: 'View all' },
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ],
    defaultValue: 'all',
  },
};

// ---------------------------------------------------------------------------
// Ghost Variant
// ---------------------------------------------------------------------------

export const Ghost: Story = {
  name: 'Ghost Variant',
  args: {
    variant: 'ghost',
    items: [
      { value: 'all', label: 'View all' },
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ],
    defaultValue: 'all',
  },
};

// ---------------------------------------------------------------------------
// With Icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  args: {
    items: [
      { value: 'list', label: 'List', icon: List },
      { value: 'grid', label: 'Grid', icon: Grid },
      { value: 'board', label: 'Board', icon: LayoutGrid },
    ],
    defaultValue: 'list',
  },
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => {
    const items = [
      { value: 'one', label: 'First' },
      { value: 'two', label: 'Second' },
      { value: 'three', label: 'Third' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ButtonGroup items={items} defaultValue="one" size="xs" />
        <ButtonGroup items={items} defaultValue="one" size="sm" />
        <ButtonGroup items={items} defaultValue="one" size="md" />
        <ButtonGroup items={items} defaultValue="one" size="lg" />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  args: {
    fullWidth: true,
    items: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'year', label: 'Year' },
    ],
    defaultValue: 'week',
  },
};

// ---------------------------------------------------------------------------
// With Disabled Items
// ---------------------------------------------------------------------------

export const WithDisabledItems: Story = {
  name: 'With Disabled Items',
  args: {
    items: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'draft', label: 'Draft', disabled: true },
      { value: 'archived', label: 'Archived' },
    ],
    defaultValue: 'all',
  },
};

// ---------------------------------------------------------------------------
// Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState('week');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ButtonGroup
            items={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
            value={value}
            onChange={setValue}
          />
          <span>Selected: {value}</span>
        </div>
      );
    };
    return <Demo />;
  },
};
