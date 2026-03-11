import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from '@coexist/wisp-core/types/DateRangePicker.types';

const meta: Meta<typeof DateRangePicker> = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
  args: { size: 'md', placeholder: 'Select dates' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {};

// ---------------------------------------------------------------------------
// WithLabel
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <DateRangePicker label="Travel Dates" placeholder="Select dates" />
  ),
};

// ---------------------------------------------------------------------------
// WithPreselected
// ---------------------------------------------------------------------------

export const WithPreselected: Story = {
  name: 'With Preselected Range',
  render: () => {
    const Demo = () => {
      const [range, setRange] = useState<DateRange>({
        start: new Date(2025, 0, 10),
        end: new Date(2025, 0, 20),
      });
      return (
        <DateRangePicker
          label="Booking Period"
          value={range}
          onChange={setRange}
        />
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// MinMaxDates
// ---------------------------------------------------------------------------

export const MinMaxDates: Story = {
  name: 'Min / Max Dates',
  render: () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    return (
      <DateRangePicker
        label="Restricted Range"
        minDate={minDate}
        maxDate={maxDate}
        placeholder="Select within range"
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
    <div style={{ display: 'flex', gap: 16 }}>
      <DateRangePicker disabled placeholder="Disabled empty" />
      <DateRangePicker
        disabled
        defaultValue={{
          start: new Date(2025, 0, 5),
          end: new Date(2025, 0, 15),
        }}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// AllSizes
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
    <span
      style={{
        width: 32,
        flexShrink: 0,
        textAlign: 'right',
        paddingTop: 8,
        fontSize: 12,
        color: '#999',
        fontWeight: 500,
      }}
    >
      {label}
    </span>
    {children}
  </div>
);

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Row key={size} label={size}>
          <DateRangePicker
            size={size}
            defaultValue={{
              start: new Date(2025, 0, 1),
              end: new Date(2025, 0, 15),
            }}
          />
        </Row>
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
        <DateRangePicker key={size} skeleton size={size} />
      ))}
    </div>
  ),
};
