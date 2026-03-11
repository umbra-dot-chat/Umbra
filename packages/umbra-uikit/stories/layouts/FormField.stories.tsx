import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from '@wisp-ui/react';
import { formFieldSizes, formFieldOrientations } from '@wisp-ui/react';
import { Input } from '@wisp-ui/react';
import { TextArea } from '@wisp-ui/react';
import { Select } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

const meta: Meta<typeof FormField> = {
  title: 'React/Layouts/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...formFieldSizes] },
    orientation: { control: 'select', options: [...formFieldOrientations] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <FormField label="Email address" description="We'll never share your email.">
        <Input placeholder="you@example.com" />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Required
// ---------------------------------------------------------------------------

export const Required: Story = {
  name: 'Required',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <FormField label="Full name" required>
        <Input placeholder="Enter your full name" />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Error
// ---------------------------------------------------------------------------

export const WithError: Story = {
  name: 'With Error',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <FormField label="Password" required error="Password must be at least 8 characters.">
        <Input type="password" placeholder="Enter password" />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      {formFieldSizes.map((s) => (
        <FormField key={s} label={`Size: ${s}`} description="Helper text" size={s}>
          <Input placeholder="Input value" size={s} />
        </FormField>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => (
    <div style={{ maxWidth: 500 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Name" orientation="horizontal" required>
          <Input placeholder="Enter name" />
        </FormField>
        <FormField label="Email" orientation="horizontal" description="Your work email">
          <Input placeholder="you@company.com" />
        </FormField>
        <FormField label="Bio" orientation="horizontal">
          <TextArea placeholder="Tell us about yourself" />
        </FormField>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Composition (full form)
// ---------------------------------------------------------------------------

export const FullForm: Story = {
  name: 'Full Form',
  render: () => (
    <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Text size="lg" weight="semibold">Create Account</Text>
      <FormField label="Full name" required>
        <Input placeholder="John Doe" />
      </FormField>
      <FormField label="Email" required description="We'll send a confirmation email.">
        <Input type="email" placeholder="john@example.com" />
      </FormField>
      <FormField label="Role">
        <Select
          options={[
            { label: 'Developer', value: 'dev' },
            { label: 'Designer', value: 'design' },
            { label: 'Manager', value: 'manager' },
          ]}
          placeholder="Select a role"
        />
      </FormField>
      <FormField label="Password" required error="Password must be at least 8 characters.">
        <Input type="password" placeholder="Enter password" />
      </FormField>
      <FormField label="Bio">
        <TextArea placeholder="Optional — tell us about yourself" />
      </FormField>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <FormField label="Disabled field" description="This field is read-only." disabled>
        <Input placeholder="Cannot edit" disabled />
      </FormField>
    </div>
  ),
};
