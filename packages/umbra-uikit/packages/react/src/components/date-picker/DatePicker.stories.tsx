import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  args: { size: 'md', placeholder: 'Select date' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    clearable: { control: 'boolean' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 260 }}>
      <DatePicker label="Start date" placeholder="Pick a date" />
      <DatePicker label="End date" defaultValue={new Date(2025, 5, 15)} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Error
// ---------------------------------------------------------------------------

export const WithError: Story = {
  name: 'With Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 260 }}>
      <DatePicker label="Due date" error="Date is required" />
      <DatePicker label="Due date" error={true} placeholder="Error highlight only" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Min / Max Dates
// ---------------------------------------------------------------------------

export const MinMaxDates: Story = {
  name: 'Min / Max Dates',
  render: () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
    return (
      <DatePicker
        label="Select within range"
        minDate={minDate}
        maxDate={maxDate}
        placeholder="Last 7 to next 14 days"
        style={{ maxWidth: 260 }}
      />
    );
  },
};

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <DatePicker disabled defaultValue={new Date(2025, 0, 15)} />
      <DatePicker disabled placeholder="Choose date" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Clearable
// ---------------------------------------------------------------------------

export const Clearable: Story = {
  name: 'Clearable',
  render: () => {
    const Demo = () => {
      const [date, setDate] = useState<Date | null>(new Date(2025, 3, 20));
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <DatePicker
            value={date ?? undefined}
            onChange={setDate}
            clearable
            label="Clearable date"
          />
          <span style={{ fontSize: 13, color: '#888' }}>
            {date ? date.toLocaleDateString() : 'No date'}
          </span>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 30, fontSize: 12, textAlign: 'right', color: '#888', flexShrink: 0 }}>
            {size}
          </span>
          <DatePicker size={size} defaultValue={new Date(2025, 7, 1)} />
        </div>
      ))}
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
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <DatePicker key={size} skeleton size={size} />
      ))}
    </div>
  ),
};
