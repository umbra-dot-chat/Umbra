import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ColorSwatch } from './ColorSwatch';
import { colorSwatchSizes, colorSwatchShapes } from '@coexist/wisp-core/types/ColorSwatch.types';
import { Text } from '../text';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ColorSwatch> = {
  title: 'Primitives/ColorSwatch',
  component: ColorSwatch,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'color' },
    size: { control: 'select', options: [...colorSwatchSizes] },
    shape: { control: 'select', options: [...colorSwatchShapes] },
    bordered: { control: 'boolean' },
    checkerboard: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ColorSwatch>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default (playground)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    color: '#3B82F6',
    size: 'md',
    shape: 'circle',
    bordered: true,
    checkerboard: false,
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes — sm, md, lg, xl
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {colorSwatchSizes.map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ColorSwatch color="#3B82F6" size={size} />
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Shapes — circle, square, rounded
// ---------------------------------------------------------------------------

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Shape variants</SectionLabel>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {colorSwatchShapes.map((shape) => (
          <div key={shape} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ColorSwatch color="#8B5CF6" size="lg" shape={shape} />
            <Text size="xs" color="tertiary">{shape}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Shapes across sizes</SectionLabel>
      {colorSwatchShapes.map((shape) => (
        <div key={shape} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Text size="xs" color="tertiary" style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>{shape}</Text>
          {colorSwatchSizes.map((size) => (
            <ColorSwatch key={size} color="#8B5CF6" size={size} shape={shape} />
          ))}
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Bordered — with and without border
// ---------------------------------------------------------------------------

export const Bordered: Story = {
  name: 'Bordered',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Bordered vs. unbounded</SectionLabel>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <ColorSwatch color="#10B981" size="lg" bordered />
          <Text size="xs" color="tertiary">bordered</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <ColorSwatch color="#10B981" size="lg" bordered={false} />
          <Text size="xs" color="tertiary">no border</Text>
        </div>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Border visibility on light colors</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ColorSwatch color="#FFFFFF" size="lg" bordered />
        <ColorSwatch color="#F3F4F6" size="lg" bordered />
        <ColorSwatch color="#FEF3C7" size="lg" bordered />
        <ColorSwatch color="#ECFDF5" size="lg" bordered />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Checkerboard — transparency pattern behind color
// ---------------------------------------------------------------------------

export const Checkerboard: Story = {
  name: 'Checkerboard',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Semi-transparent colors with checkerboard</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <ColorSwatch color="rgba(59, 130, 246, 0.5)" size="lg" checkerboard />
        <ColorSwatch color="rgba(16, 185, 129, 0.3)" size="lg" checkerboard />
        <ColorSwatch color="rgba(239, 68, 68, 0.6)" size="lg" checkerboard />
        <ColorSwatch color="rgba(139, 92, 246, 0.4)" size="lg" checkerboard />
        <ColorSwatch color="transparent" size="lg" checkerboard />
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Checkerboard across sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {colorSwatchSizes.map((size) => (
          <ColorSwatch key={size} color="rgba(59, 130, 246, 0.4)" size={size} checkerboard />
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Opaque vs. semi-transparent comparison</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <ColorSwatch color="#3B82F6" size="lg" />
          <Text size="xs" color="tertiary">opaque</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <ColorSwatch color="rgba(59, 130, 246, 0.5)" size="lg" checkerboard />
          <Text size="xs" color="tertiary">50% alpha</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <ColorSwatch color="rgba(59, 130, 246, 0.2)" size="lg" checkerboard />
          <Text size="xs" color="tertiary">20% alpha</Text>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Palette — row of swatches showing a color palette
// ---------------------------------------------------------------------------

export const Palette: Story = {
  name: 'Palette',
  render: () => {
    const blues = ['#EFF6FF', '#BFDBFE', '#60A5FA', '#3B82F6', '#2563EB', '#1E40AF', '#1E3A8A'];
    const greens = ['#ECFDF5', '#A7F3D0', '#34D399', '#10B981', '#059669', '#047857', '#064E3B'];
    const warm = ['#FEF3C7', '#FDE68A', '#FBBF24', '#F59E0B', '#F97316', '#EF4444', '#B91C1C'];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>Blue palette</SectionLabel>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {blues.map((c) => (
            <ColorSwatch key={c} color={c} size="lg" shape="rounded" />
          ))}
        </div>

        <SectionLabel>Green palette</SectionLabel>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {greens.map((c) => (
            <ColorSwatch key={c} color={c} size="lg" shape="rounded" />
          ))}
        </div>

        <SectionLabel>Warm palette</SectionLabel>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {warm.map((c) => (
            <ColorSwatch key={c} color={c} size="lg" shape="rounded" />
          ))}
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 7. WithLabel — swatch next to a hex code
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => {
    const colors = [
      { hex: '#3B82F6', name: 'Blue 500' },
      { hex: '#10B981', name: 'Emerald 500' },
      { hex: '#F59E0B', name: 'Amber 500' },
      { hex: '#EF4444', name: 'Red 500' },
      { hex: '#8B5CF6', name: 'Violet 500' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>Swatch with hex label</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {colors.map(({ hex, name }) => (
            <div key={hex} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <ColorSwatch color={hex} size="md" />
              <Text size="sm" color="primary" style={{ fontFamily: 'monospace' }}>{hex}</Text>
              <Text size="xs" color="tertiary">{name}</Text>
            </div>
          ))}
        </div>

        <div style={{ height: 8 }} />
        <SectionLabel>Inline swatch with text</SectionLabel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {colors.map(({ hex }) => (
            <div key={hex} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '4px 8px' }}>
              <ColorSwatch color={hex} size="sm" />
              <Text size="xs" color="secondary" style={{ fontFamily: 'monospace' }}>{hex}</Text>
            </div>
          ))}
        </div>
      </div>
    );
  },
};
