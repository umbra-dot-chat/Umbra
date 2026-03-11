import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TimePicker } from './TimePicker';

const meta: Meta<typeof TimePicker> = {
  title: 'Components/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
  args: { size: 'md', format: '12h', placeholder: 'Select time' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    format: { control: 'select', options: ['12h', '24h'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    error: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {},
};

// ---------------------------------------------------------------------------
// 24-Hour Format
// ---------------------------------------------------------------------------

export const TwentyFourHour: Story = {
  name: '24-Hour Format',
  args: {
    format: '24h',
    defaultValue: '14:30',
  },
};

// ---------------------------------------------------------------------------
// 15-Minute Step
// ---------------------------------------------------------------------------

export const FifteenMinuteStep: Story = {
  name: '15-Minute Step',
  args: {
    minuteStep: 15,
    defaultValue: '09:00',
  },
};

// ---------------------------------------------------------------------------
// With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  args: {
    label: 'Start time',
    defaultValue: '10:30',
  },
};

// ---------------------------------------------------------------------------
// With Error
// ---------------------------------------------------------------------------

export const WithError: Story = {
  name: 'With Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TimePicker label="Meeting time" error="Time is required" />
      <TimePicker label="End time" error defaultValue="17:00" />
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
      <TimePicker disabled defaultValue="09:30" />
      <TimePicker disabled placeholder="Select time" />
    </div>
  ),
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
          <span style={{ width: 24, fontSize: 12, color: '#888', textAlign: 'right' }}>{size}</span>
          <TimePicker size={size} defaultValue="14:30" />
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
        <TimePicker key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const Demo = () => {
      const [time, setTime] = useState('09:15');
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <TimePicker value={time} onChange={setTime} label="Time" />
          <span style={{ fontSize: 13, color: '#888' }}>Value: {time}</span>
        </div>
      );
    };
    return <Demo />;
  },
};
