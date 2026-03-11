import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Radio, RadioGroup } from '@wisp-ui/react-native';
import { componentSizes } from '@wisp-ui/react';

const meta: Meta<typeof Radio> = {
  title: 'React Native/Primitives/Radio',
  component: Radio,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Radio>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <Radio value="option1" label="Option 1" />
      <Radio value="option2" label="Option 2" />
      <Radio value="option3" label="Option 3" />
    </RadioGroup>
  ),
};

// ---------------------------------------------------------------------------
// 2. RadioGroup Example
// ---------------------------------------------------------------------------

export const RadioGroupExample: Story = {
  name: 'RadioGroup Example',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Vertical (Default)</div>
      <RadioGroup defaultValue="email" orientation="vertical">
        <Radio value="email" label="Email" description="Receive notifications via email." />
        <Radio value="sms" label="SMS" description="Receive notifications via text message." />
        <Radio value="push" label="Push" description="Receive push notifications on your device." />
      </RadioGroup>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Horizontal</div>
      <RadioGroup defaultValue="light" orientation="horizontal">
        <Radio value="light" label="Light" />
        <Radio value="dark" label="Dark" />
        <Radio value="system" label="System" />
      </RadioGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Group Disabled</div>
      <RadioGroup defaultValue="a" disabled>
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
        <Radio value="c" label="Option C" />
      </RadioGroup>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Individual Disabled</div>
      <RadioGroup defaultValue="available">
        <Radio value="available" label="Available" />
        <Radio value="unavailable" label="Unavailable (disabled)" disabled />
        <Radio value="other" label="Other" />
      </RadioGroup>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Error State</div>
      <RadioGroup defaultValue="yes" error>
        <Radio value="yes" label="Yes" />
        <Radio value="no" label="No" />
      </RadioGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            {size.toUpperCase()}
          </div>
          <RadioGroup defaultValue="first" size={size}>
            <Radio value="first" label={`First (${size})`} />
            <Radio value="second" label={`Second (${size})`} />
          </RadioGroup>
        </div>
      ))}
    </div>
  ),
};
