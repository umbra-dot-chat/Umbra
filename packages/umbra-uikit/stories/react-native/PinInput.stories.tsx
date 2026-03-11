import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PinInput } from '@wisp-ui/react-native';

const meta: Meta<typeof PinInput> = {
  title: 'React Native/Primitives/PinInput',
  component: PinInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    length: { control: 'number' },
    mask: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof PinInput>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    length: 6,
    size: 'md',
    label: 'Verification Code',
  },
};

// ---------------------------------------------------------------------------
// 2. With Length
// ---------------------------------------------------------------------------

export const WithLength: Story = {
  name: 'With Length',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>4-digit PIN</div>
      <PinInput length={4} label="PIN" hint="Enter your 4-digit PIN" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>6-digit OTP</div>
      <PinInput length={6} label="OTP" hint="Enter the 6-digit code sent to your phone" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>8-character code</div>
      <PinInput length={8} type="text" label="Invite Code" hint="Letters and numbers allowed" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Masked
// ---------------------------------------------------------------------------

export const Masked: Story = {
  name: 'Masked',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Masked 4-digit PIN</div>
      <PinInput length={4} mask label="PIN" hint="Digits are hidden for security" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Masked 6-digit OTP</div>
      <PinInput length={6} mask label="Secure Code" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled empty</div>
      <PinInput length={6} disabled label="Verification Code" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled with value</div>
      <PinInput length={4} disabled defaultValue="1234" label="Confirmed PIN" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Error & Warning
// ---------------------------------------------------------------------------

export const ErrorAndWarning: Story = {
  name: 'Error & Warning',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Error with message</div>
      <PinInput length={6} label="Code" error="Invalid verification code" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Warning with message</div>
      <PinInput length={6} label="Code" warning="Code expires in 30 seconds" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Extra small</div>
      <PinInput size="xs" length={4} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Small</div>
      <PinInput size="sm" length={4} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Medium</div>
      <PinInput size="md" length={4} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Large</div>
      <PinInput size="lg" length={4} />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Extra large</div>
      <PinInput size="xl" length={4} />
    </div>
  ),
};
