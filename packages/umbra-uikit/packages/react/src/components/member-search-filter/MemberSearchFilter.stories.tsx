/**
 * MemberSearchFilter -- Stories for the member search filter component.
 *
 * @module stories/member-search-filter
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemberSearchFilter } from './MemberSearchFilter';

const meta: Meta<typeof MemberSearchFilter> = {
  title: 'Components/Community/MemberSearchFilter',
  component: MemberSearchFilter,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    loading: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    resultCount: { control: 'number' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof MemberSearchFilter>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    placeholder: 'Search members...',
    size: 'sm',
  },
};

// ---------------------------------------------------------------------------
// WithResultCount
// ---------------------------------------------------------------------------

export const WithResultCount: Story = {
  name: 'With Result Count',
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState('');
      const count = value ? Math.max(0, 24 - value.length * 3) : undefined;
      return (
        <div style={{ maxWidth: 320 }}>
          <MemberSearchFilter
            value={value}
            onChange={setValue}
            resultCount={count}
          />
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading',
  args: {
    loading: true,
    value: 'searching...',
  },
};

// ---------------------------------------------------------------------------
// MediumSize
// ---------------------------------------------------------------------------

export const MediumSize: Story = {
  name: 'Medium Size',
  args: {
    size: 'md',
    placeholder: 'Search members...',
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    skeleton: true,
  },
};
