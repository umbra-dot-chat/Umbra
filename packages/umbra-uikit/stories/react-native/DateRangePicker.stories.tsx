import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DateRangePicker, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof DateRangePicker> = {
  title: 'React Native/Components/Date & Time/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    label: 'Date range',
    placeholder: 'Select dates',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. With Min / Max
// ---------------------------------------------------------------------------

export const WithMinMax: Story = {
  name: 'With Min / Max',
  render: () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 320 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Restricted to current &amp; next month
        </div>
        <DateRangePicker
          label="Trip dates"
          placeholder="Pick a range"
          minDate={minDate}
          maxDate={maxDate}
        />

        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Future dates only
        </div>
        <DateRangePicker
          label="Booking window"
          placeholder="Pick start and end"
          minDate={today}
        />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledExample = () => {
      const today = new Date();
      const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
      const [range, setRange] = useState({ start: today, end: nextWeek });

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <DateRangePicker
            label="Controlled range"
            value={range}
            onChange={setRange}
          />
          <Text size="sm" color="secondary">
            {range.start && range.end
              ? `${range.start.toLocaleDateString()} – ${range.end.toLocaleDateString()}`
              : 'No range selected'}
          </Text>
        </div>
      );
    };
    return <ControlledExample />;
  },
};
