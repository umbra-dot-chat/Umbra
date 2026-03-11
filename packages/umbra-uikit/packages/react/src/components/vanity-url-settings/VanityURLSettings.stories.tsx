import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VanityURLSettings } from './VanityURLSettings';
import { vanityUrlAvailabilityStates } from '@coexist/wisp-core/types/VanityURLSettings.types';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof VanityURLSettings> = {
  title: 'Components/Community/VanityURLSettings',
  component: VanityURLSettings,
  tags: ['autodocs'],
  argTypes: {
    availability: { control: 'select', options: [undefined, ...vanityUrlAvailabilityStates] },
    saving: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof VanityURLSettings>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    currentSlug: 'my-community',
    baseUrl: 'umbra.app/c/',
    saving: false,
    skeleton: false,
  },
};

// ---------------------------------------------------------------------------
// 2. Available
// ---------------------------------------------------------------------------

export const Available: Story = {
  name: 'Available',
  args: {
    currentSlug: 'wisp-ui',
    availability: 'available',
  },
};

// ---------------------------------------------------------------------------
// 3. Taken
// ---------------------------------------------------------------------------

export const Taken: Story = {
  name: 'Taken',
  args: {
    currentSlug: 'discord',
    availability: 'taken',
  },
};

// ---------------------------------------------------------------------------
// 4. Checking
// ---------------------------------------------------------------------------

export const Checking: Story = {
  name: 'Checking',
  args: {
    currentSlug: 'new-slug',
    availability: 'checking',
  },
};

// ---------------------------------------------------------------------------
// 5. Invalid
// ---------------------------------------------------------------------------

export const Invalid: Story = {
  name: 'Invalid',
  args: {
    currentSlug: '',
    availability: 'invalid',
  },
};

// ---------------------------------------------------------------------------
// 6. Saving
// ---------------------------------------------------------------------------

export const Saving: Story = {
  name: 'Saving',
  args: {
    currentSlug: 'my-community',
    availability: 'available',
    saving: true,
  },
};

// ---------------------------------------------------------------------------
// 7. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    skeleton: true,
  },
};
