import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TextArea> = {
  title: 'React/Primitives/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    skeleton: false,
    fullWidth: false,
    placeholder: 'Enter text...',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
    <Text size="xs" color="tertiary" weight="medium" style={{ width: 100, flexShrink: 0, textAlign: 'right', paddingTop: 8 }}>
      {label}
    </Text>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <TextArea {...args} />,
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Row key={size} label={size}>
          <TextArea size={size} placeholder={`Size ${size}`} />
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TextArea label="Description" placeholder="Enter a description..." size="md" />
      <TextArea label="Notes" placeholder="Add your notes here..." size="md" />
      <TextArea label="Comments" placeholder="Leave a comment..." size="sm" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Hint
// ---------------------------------------------------------------------------

export const WithHint: Story = {
  name: 'With Hint',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TextArea
        label="Bio"
        placeholder="Tell us about yourself..."
        hint="Max 500 characters."
        size="md"
      />
      <TextArea
        label="Feedback"
        placeholder="Share your thoughts..."
        hint="Your feedback helps us improve."
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Error
// ---------------------------------------------------------------------------

export const Error: Story = {
  name: 'Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TextArea
        label="Description"
        placeholder="Enter a description..."
        error="Description is required."
        size="md"
      />
      <TextArea
        label="Message"
        placeholder="Enter your message..."
        error="Message must be at least 10 characters."
        size="md"
      />
      <TextArea
        placeholder="Boolean error (red border only)"
        error={true}
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Warning
// ---------------------------------------------------------------------------

export const Warning: Story = {
  name: 'Warning',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TextArea
        label="Description"
        placeholder="Enter a description..."
        warning="Description is getting long."
        size="md"
      />
      <TextArea
        placeholder="Boolean warning (yellow border only)"
        warning={true}
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TextArea
        label="Disabled textarea"
        placeholder="Cannot type here"
        disabled
        size="md"
      />
      <TextArea
        placeholder="Disabled with value"
        value="Read-only content that cannot be edited."
        disabled
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <TextArea key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
      <TextArea fullWidth placeholder="Full width textarea" size="md" />
      <TextArea fullWidth label="Description" placeholder="Enter a description..." hint="Full width with label and hint" size="md" />
      <TextArea fullWidth placeholder="Full width large" size="lg" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 10. Resize Variants
// ---------------------------------------------------------------------------

export const ResizeVariants: Story = {
  name: 'Resize Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TextArea
        label="Resize: vertical (default)"
        placeholder="Can resize vertically..."
        resize="vertical"
        size="md"
      />
      <TextArea
        label="Resize: none"
        placeholder="Cannot be resized..."
        resize="none"
        size="md"
      />
      <TextArea
        label="Resize: both"
        placeholder="Can resize in both directions..."
        resize="both"
        size="md"
      />
      <TextArea
        label="Resize: horizontal"
        placeholder="Can resize horizontally..."
        resize="horizontal"
        size="md"
      />
    </div>
  ),
};
