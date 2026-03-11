import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from './Calendar';
import { calendarSizes } from '@coexist/wisp-core/types/Calendar.types';

const meta: Meta<typeof Calendar> = {
  title: 'Components/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...calendarSizes] },
    skeleton: { control: 'boolean' },
    weekStartsOn: { control: 'select', options: [0, 1] },
    showOutsideDays: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Calendar onChange={setDate} />
        <span style={{ color: '#8B8FA3', fontSize: 13 }}>
          {date ? `Selected: ${date.toLocaleDateString()}` : 'No date selected'}
        </span>
      </div>
    );
  },
};

export const WithSelectedDate: Story = {
  name: 'WithSelectedDate',
  render: () => {
    const [date, setDate] = useState<Date>(new Date(2025, 0, 15));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Calendar value={date} onChange={setDate} />
        <span style={{ color: '#8B8FA3', fontSize: 13 }}>
          Selected: {date.toLocaleDateString()}
        </span>
      </div>
    );
  },
};

export const MinMaxDates: Story = {
  name: 'MinMaxDates',
  render: () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 5);
    const maxDate = new Date(today.getFullYear(), today.getMonth(), 25);
    const [date, setDate] = useState<Date | undefined>(undefined);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Calendar minDate={minDate} maxDate={maxDate} onChange={setDate} />
        <span style={{ color: '#8B8FA3', fontSize: 13 }}>
          Range: {minDate.toLocaleDateString()} -- {maxDate.toLocaleDateString()}
          {date ? ` | Selected: ${date.toLocaleDateString()}` : ''}
        </span>
      </div>
    );
  },
};

export const DisabledDates: Story = {
  name: 'DisabledDates',
  render: () => {
    const today = new Date();
    const disabledDates = [
      new Date(today.getFullYear(), today.getMonth(), 10),
      new Date(today.getFullYear(), today.getMonth(), 11),
      new Date(today.getFullYear(), today.getMonth(), 12),
      new Date(today.getFullYear(), today.getMonth(), 20),
    ];
    const [date, setDate] = useState<Date | undefined>(undefined);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Calendar disabledDates={disabledDates} onChange={setDate} />
        <span style={{ color: '#8B8FA3', fontSize: 13 }}>
          Disabled: 10th, 11th, 12th, 20th
          {date ? ` | Selected: ${date.toLocaleDateString()}` : ''}
        </span>
      </div>
    );
  },
};

export const MondayStart: Story = {
  name: 'MondayStart',
  render: () => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Calendar weekStartsOn={1} onChange={setDate} />
        <span style={{ color: '#8B8FA3', fontSize: 13 }}>
          Week starts on Monday
          {date ? ` | Selected: ${date.toLocaleDateString()}` : ''}
        </span>
      </div>
    );
  },
};

export const AllSizes: Story = {
  name: 'AllSizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ color: '#8B8FA3', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            {size}
          </span>
          <Calendar size={size} defaultValue={new Date(2025, 0, 15)} />
        </div>
      ))}
    </div>
  ),
};

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Calendar key={size} skeleton size={size} />
      ))}
    </div>
  ),
};
