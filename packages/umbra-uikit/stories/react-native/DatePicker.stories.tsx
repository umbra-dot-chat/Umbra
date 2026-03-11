import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof DatePicker> = {
  title: 'React Native/Components/Date & Time/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    format: { control: 'select', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] },
    disabled: { control: 'boolean' },
    clearable: { control: 'boolean' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    label: 'Date',
    placeholder: 'Select date',
    size: 'md',
    format: 'MM/DD/YYYY',
    clearable: true,
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
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 320 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Current month only
        </div>
        <DatePicker
          label="Appointment"
          placeholder="Pick a day this month"
          minDate={minDate}
          maxDate={maxDate}
        />

        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Future dates only
        </div>
        <DatePicker
          label="Departure"
          placeholder="Pick a future date"
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
      const [date, setDate] = useState<Date | null>(new Date());
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <DatePicker
            label="Controlled date"
            value={date ?? undefined}
            onChange={setDate}
          />
          <Text size="sm" color="secondary">
            Selected: {date ? date.toLocaleDateString() : 'None'}
          </Text>
        </div>
      );
    };
    return <ControlledExample />;
  },
};
