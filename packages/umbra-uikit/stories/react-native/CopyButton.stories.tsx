import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CopyButton } from '@wisp-ui/react-native';

const meta: Meta<typeof CopyButton> = {
  title: 'React Native/Components/Utilities/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['outline', 'ghost', 'minimal'] },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    value: 'npm install @wisp-ui/react-native',
    label: 'Copy',
    size: 'md',
    variant: 'outline',
  },
};

// ---------------------------------------------------------------------------
// 2. With Custom Text
// ---------------------------------------------------------------------------

export const WithCustomText: Story = {
  name: 'With Custom Text',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>With Label</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <CopyButton value="some-value" label="Copy" />
        <CopyButton value="https://example.com" label="Copy Link" />
        <CopyButton value="abc123" label="Copy Code" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Custom Copied Label</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <CopyButton value="hello" label="Copy" copiedLabel="Done!" />
        <CopyButton value="hello" label="Copy" copiedLabel="Saved to clipboard" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Icon Only (no label)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <CopyButton value="icon-only-value" />
        <CopyButton value="icon-only-value" variant="ghost" />
        <CopyButton value="icon-only-value" variant="minimal" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Small</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <CopyButton value="small" size="sm" label="Copy" />
        <CopyButton value="small" size="sm" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Medium</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <CopyButton value="medium" size="md" label="Copy" />
        <CopyButton value="medium" size="md" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Large</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <CopyButton value="large" size="lg" label="Copy" />
        <CopyButton value="large" size="lg" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Outline</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <CopyButton value="outline" variant="outline" label="Copy" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Ghost</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <CopyButton value="ghost" variant="ghost" label="Copy" />
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Minimal</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <CopyButton value="minimal" variant="minimal" label="Copy" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <CopyButton value="disabled" label="Copy" disabled />
      <CopyButton value="disabled" label="Copy" disabled variant="ghost" />
      <CopyButton value="disabled" disabled />
    </div>
  ),
};
