import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TimePicker, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof TimePicker> = {
  title: 'React Native/Components/Date & Time/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    format: { control: 'select', options: ['12h', '24h'] },
    minuteStep: { control: 'number' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    label: 'Time',
    placeholder: 'Select time',
    size: 'md',
    format: '12h',
  },
};

// ---------------------------------------------------------------------------
// 2. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledExample = () => {
      const [time, setTime] = useState('14:30');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
          <TimePicker
            label="Controlled time"
            value={time}
            onChange={setTime}
            format="12h"
          />
          <Text size="sm" color="secondary">Selected: {time}</Text>
        </div>
      );
    };
    return <ControlledExample />;
  },
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 320 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Enabled
        </div>
        <TimePicker label="Meeting time" defaultValue="09:00" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Disabled
        </div>
        <TimePicker label="Locked time" defaultValue="09:00" disabled />
      </div>
    </div>
  ),
};
