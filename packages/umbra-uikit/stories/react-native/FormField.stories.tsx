import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FormField, Input } from '@wisp-ui/react-native';

const meta: Meta<typeof FormField> = {
  title: 'React Native/Layouts/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    onSurface: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <FormField label="Username">
        <Input placeholder="Enter your username" />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Error
// ---------------------------------------------------------------------------

export const WithError: Story = {
  name: 'With Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Error message replaces description
      </div>
      <FormField label="Email" error="Please enter a valid email address">
        <Input placeholder="you@example.com" />
      </FormField>
      <FormField label="Password" error="Password must be at least 8 characters">
        <Input placeholder="Enter password" />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Required
// ---------------------------------------------------------------------------

export const Required: Story = {
  name: 'Required',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Required indicator shown next to label
      </div>
      <FormField label="Full Name" required>
        <Input placeholder="John Doe" />
      </FormField>
      <FormField label="Email" required description="We'll never share your email.">
        <Input placeholder="you@example.com" />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Horizontal orientation
      </div>
      <FormField label="First Name" orientation="horizontal">
        <Input placeholder="John" />
      </FormField>
      <FormField label="Last Name" orientation="horizontal">
        <Input placeholder="Doe" />
      </FormField>
      <FormField label="Bio" orientation="horizontal" description="Tell us about yourself.">
        <Input placeholder="A few words..." />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Helper Text
// ---------------------------------------------------------------------------

export const WithHelperText: Story = {
  name: 'With Helper Text',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Description text below the control
      </div>
      <FormField label="Username" description="3-20 characters, letters and numbers only.">
        <Input placeholder="johndoe" />
      </FormField>
      <FormField label="Website" description="Include the full URL with https://">
        <Input placeholder="https://example.com" />
      </FormField>
    </div>
  ),
};
