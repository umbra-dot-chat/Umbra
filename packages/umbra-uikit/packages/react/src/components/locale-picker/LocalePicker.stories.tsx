import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LocalePicker } from './LocalePicker';
import type { LocaleOption } from '@coexist/wisp-core/types/LocalePicker.types';

const meta: Meta<typeof LocalePicker> = {
  title: 'Components/LocalePicker',
  component: LocalePicker,
  tags: ['autodocs'],
  args: { size: 'md', placeholder: 'Select language' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    searchable: { control: 'boolean' },
    groupByRegion: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof LocalePicker>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {},
};

// ---------------------------------------------------------------------------
// With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300 }}>
      <LocalePicker label="Language" />
      <LocalePicker label="Preferred Language" defaultValue="fr-FR" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Searchable
// ---------------------------------------------------------------------------

export const Searchable: Story = {
  name: 'Searchable',
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<string | undefined>();
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300 }}>
          <LocalePicker
            label="Search & Select"
            value={value}
            onChange={setValue}
            searchable
          />
          <span style={{ fontSize: 13, opacity: 0.6 }}>
            Selected: {value ?? 'none'}
          </span>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Without Grouping
// ---------------------------------------------------------------------------

export const WithoutGrouping: Story = {
  name: 'Without Grouping',
  render: () => (
    <LocalePicker
      label="Flat List"
      groupByRegion={false}
      style={{ maxWidth: 300 }}
    />
  ),
};

// ---------------------------------------------------------------------------
// Custom Options
// ---------------------------------------------------------------------------

const customOptions: LocaleOption[] = [
  { code: 'en-GB', label: 'English (UK)', nativeLabel: 'English', region: 'Europe' },
  { code: 'en-AU', label: 'English (Australia)', nativeLabel: 'English', region: 'Oceania' },
  { code: 'fr-CA', label: 'French (Canada)', nativeLabel: 'Français', region: 'Americas' },
  { code: 'es-MX', label: 'Spanish (Mexico)', nativeLabel: 'Español', region: 'Americas' },
  { code: 'pt-PT', label: 'Portuguese (Portugal)', nativeLabel: 'Português', region: 'Europe' },
  { code: 'de-AT', label: 'German (Austria)', nativeLabel: 'Deutsch', region: 'Europe' },
];

export const CustomOptions: Story = {
  name: 'Custom Options',
  render: () => (
    <LocalePicker
      label="Custom Locales"
      options={customOptions}
      placeholder="Choose locale..."
      style={{ maxWidth: 300 }}
    />
  ),
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 24, fontSize: 12, opacity: 0.5, textAlign: 'right', flexShrink: 0 }}>{s}</span>
          <LocalePicker size={s} defaultValue="en-US" />
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
      <LocalePicker disabled defaultValue="ja-JP" />
      <LocalePicker disabled placeholder="Select language" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <LocalePicker key={s} skeleton size={s} />
      ))}
    </div>
  ),
};
