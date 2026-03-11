import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThemePreview } from './ThemePreview';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ThemePreview> = {
  title: 'Components/Community/ThemePreview',
  component: ThemePreview,
  tags: ['autodocs'],
  argTypes: {
    accentColor: { control: 'color' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ThemePreview>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    communityName: 'My Community',
    accentColor: '#6366f1',
    skeleton: false,
  },
};

// ---------------------------------------------------------------------------
// 2. Red Accent
// ---------------------------------------------------------------------------

export const RedAccent: Story = {
  name: 'Red Accent',
  args: {
    communityName: 'Fire Community',
    accentColor: '#ef4444',
  },
};

// ---------------------------------------------------------------------------
// 3. Green Accent
// ---------------------------------------------------------------------------

export const GreenAccent: Story = {
  name: 'Green Accent',
  args: {
    communityName: 'Nature Hub',
    accentColor: '#22c55e',
  },
};

// ---------------------------------------------------------------------------
// 4. With Custom CSS
// ---------------------------------------------------------------------------

export const WithCustomCSS: Story = {
  name: 'With Custom CSS',
  args: {
    communityName: 'Styled Space',
    accentColor: '#8b5cf6',
    customCss: '[data-part="header"] { font-style: italic; }\n[data-part="channels"] { opacity: 0.8; }',
  },
};

// ---------------------------------------------------------------------------
// 5. With Custom Icon
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  name: 'With Custom Icon',
  args: {
    communityName: 'Wisp UI',
    accentColor: '#3b82f6',
    communityIcon: <span style={{ fontSize: 16 }}>W</span>,
  },
};

// ---------------------------------------------------------------------------
// 6. Color Comparison
// ---------------------------------------------------------------------------

export const ColorComparison: Story = {
  name: 'Color Comparison',
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {['#6366f1', '#ef4444', '#22c55e', '#f97316', '#ec4899', '#3b82f6'].map((color) => (
        <ThemePreview key={color} accentColor={color} communityName={color} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    skeleton: true,
  },
};
