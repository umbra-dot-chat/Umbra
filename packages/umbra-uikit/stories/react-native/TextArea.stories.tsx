import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from '@wisp-ui/react-native';

const meta: Meta<typeof TextArea> = {
  title: 'React Native/Primitives/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Placeholder
// ---------------------------------------------------------------------------

export const Placeholder: Story = {
  name: 'Placeholder',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>With label and hint</div>
      <TextArea
        label="Description"
        hint="Max 500 characters."
        placeholder="Tell us about yourself..."
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Placeholder only</div>
      <TextArea placeholder="Write your message here..." />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled empty</div>
      <TextArea label="Notes" disabled placeholder="Cannot edit this" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled with value</div>
      <TextArea label="Notes" disabled value="This content is locked." />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Extra small</div>
      <TextArea size="xs" placeholder="Extra small" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Small</div>
      <TextArea size="sm" placeholder="Small" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Medium</div>
      <TextArea size="md" placeholder="Medium" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Large</div>
      <TextArea size="lg" placeholder="Large" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Extra large</div>
      <TextArea size="xl" placeholder="Extra large" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Error & Warning
// ---------------------------------------------------------------------------

export const ErrorAndWarning: Story = {
  name: 'Error & Warning',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Error with message</div>
      <TextArea label="Bio" error="Bio is required." placeholder="Tell us about yourself" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Error boolean</div>
      <TextArea label="Bio" error={true} placeholder="Something went wrong" />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Warning with message</div>
      <TextArea label="Comment" warning="This comment is unusually long." placeholder="Add a comment" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ width: 480 }}>
      <TextArea
        fullWidth
        label="Feedback"
        hint="Your feedback helps us improve."
        placeholder="Share your thoughts..."
      />
    </div>
  ),
};
