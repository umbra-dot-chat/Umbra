import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from './AspectRatio';
import { Text } from '../../primitives/text';
import { useThemeColors } from '../../providers';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof AspectRatio> = {
  title: 'Layouts/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
  argTypes: {
    ratio: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

// ---------------------------------------------------------------------------
// Helper: colored placeholder box
// ---------------------------------------------------------------------------

const Placeholder = ({ label }: { label: string }) => {
  const themeColors = useThemeColors();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: themeColors.background.raised,
        borderRadius: 8,
        border: `1px solid ${themeColors.border.subtle}`,
      }}
    >
      <Text size="sm" color="secondary" weight="semibold">
        {label}
      </Text>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default (16:9)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    ratio: 16 / 9,
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <AspectRatio {...args}>
        <Placeholder label="16 : 9" />
      </AspectRatio>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Square (1:1)
// ---------------------------------------------------------------------------

export const Square: Story = {
  name: 'Square (1:1)',
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <SectionLabel>1 : 1</SectionLabel>
      <AspectRatio ratio={1}>
        <Placeholder label="1 : 1" />
      </AspectRatio>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Cinematic (21:9)
// ---------------------------------------------------------------------------

export const Cinematic: Story = {
  name: 'Cinematic (21:9)',
  render: () => (
    <div style={{ maxWidth: 600 }}>
      <SectionLabel>21 : 9</SectionLabel>
      <AspectRatio ratio={21 / 9}>
        <Placeholder label="21 : 9" />
      </AspectRatio>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. WithImage
// ---------------------------------------------------------------------------

export const WithImage: Story = {
  name: 'With Image',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <SectionLabel>Image inside 16 : 9</SectionLabel>
      <AspectRatio ratio={16 / 9}>
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=960&h=540&fit=crop"
          alt="Landscape"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
        />
      </AspectRatio>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. WithVideo
// ---------------------------------------------------------------------------

export const WithVideo: Story = {
  name: 'With Video',
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <SectionLabel>Video embed in 16 : 9</SectionLabel>
      <AspectRatio ratio={16 / 9}>
        <iframe
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="Video embed"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
        />
      </AspectRatio>
    </div>
  ),
};
