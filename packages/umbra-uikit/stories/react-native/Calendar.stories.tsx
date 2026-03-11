import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from '@wisp-ui/react-native';

const meta: Meta<typeof Calendar> = {
  title: 'React Native/Components/Date & Time/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    weekStartsOn: { control: 'select', options: [0, 1] },
    showOutsideDays: { control: 'boolean' },
    locale: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    size: 'md',
    showOutsideDays: true,
    weekStartsOn: 0,
    locale: 'en-US',
  },
  render: (args) => <Calendar {...args} />,
};

// ---------------------------------------------------------------------------
// 2. SelectedDate
// ---------------------------------------------------------------------------

function SelectedDateExample() {
  const [date, setDate] = useState(new Date(2026, 1, 9));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={sectionLabel}>Controlled selection</div>
      <Calendar value={date} onChange={setDate} />
      <div style={{ fontSize: 13, color: '#6B7280' }}>
        Selected: <strong>{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
      </div>

      <div style={sectionLabel}>Sizes</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={sectionLabel}>{size}</div>
            <Calendar size={size} defaultValue={new Date(2026, 1, 9)} />
          </div>
        ))}
      </div>

      <div style={sectionLabel}>Week starts on Monday</div>
      <Calendar defaultValue={new Date(2026, 1, 9)} weekStartsOn={1} />
    </div>
  );
}

export const SelectedDate: Story = {
  name: 'Selected Date',
  render: () => <SelectedDateExample />,
};

// ---------------------------------------------------------------------------
// 3. MinMaxDates
// ---------------------------------------------------------------------------

export const MinMaxDates: Story = {
  name: 'Min/Max Dates',
  render: () => {
    const today = new Date(2026, 1, 9);
    const minDate = new Date(2026, 1, 3);
    const maxDate = new Date(2026, 1, 21);

    const disabledDates = [
      new Date(2026, 1, 14),
      new Date(2026, 1, 15),
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={sectionLabel}>Date range restriction (Feb 3 - Feb 21)</div>
        <Calendar
          defaultValue={today}
          minDate={minDate}
          maxDate={maxDate}
        />

        <div style={sectionLabel}>With disabled specific dates (Feb 14, 15)</div>
        <Calendar
          defaultValue={today}
          disabledDates={disabledDates}
        />

        <div style={sectionLabel}>Combined: range + disabled dates</div>
        <Calendar
          defaultValue={today}
          minDate={minDate}
          maxDate={maxDate}
          disabledDates={disabledDates}
          showOutsideDays={false}
        />
      </div>
    );
  },
};
