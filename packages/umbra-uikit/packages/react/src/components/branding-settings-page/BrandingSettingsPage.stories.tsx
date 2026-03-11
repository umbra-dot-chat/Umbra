import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BrandingSettingsPage } from './BrandingSettingsPage';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof BrandingSettingsPage> = {
  title: 'Components/Community/BrandingSettingsPage',
  component: BrandingSettingsPage,
  tags: ['autodocs'],
  argTypes: {
    accentColor: { control: 'color' },
    saving: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof BrandingSettingsPage>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    accentColor: '#6366f1',
    customCss: '',
    saving: false,
    skeleton: false,
  },
};

// ---------------------------------------------------------------------------
// 2. With Images
// ---------------------------------------------------------------------------

export const WithImages: Story = {
  name: 'With Images',
  args: {
    iconUrl: 'https://picsum.photos/80',
    bannerUrl: 'https://picsum.photos/600/120',
    splashUrl: 'https://picsum.photos/600/200',
    accentColor: '#8b5cf6',
  },
};

// ---------------------------------------------------------------------------
// 3. With Custom CSS
// ---------------------------------------------------------------------------

export const WithCustomCSS: Story = {
  name: 'With Custom CSS',
  args: {
    accentColor: '#ef4444',
    customCss: '/* Custom community styles */\n.header {\n  font-family: "Fira Code", monospace;\n  text-shadow: 0 1px 2px rgba(0,0,0,0.3);\n}',
  },
};

// ---------------------------------------------------------------------------
// 4. Saving State
// ---------------------------------------------------------------------------

export const Saving: Story = {
  name: 'Saving',
  args: {
    accentColor: '#22c55e',
    saving: true,
  },
};

// ---------------------------------------------------------------------------
// 5. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    skeleton: true,
  },
};
