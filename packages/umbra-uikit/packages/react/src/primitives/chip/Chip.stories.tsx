import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from './Chip';
import { chipColors, chipSizes, chipVariants } from '@coexist/wisp-core/types/Chip.types';
import { Text } from '../text';
import { Star, Check, AlertCircle, Info, Tag, Zap } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Chip> = {
  title: 'Primitives/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: [...chipColors] },
    size: { control: 'select', options: [...chipSizes] },
    variant: { control: 'select', options: [...chipVariants] },
    removable: { control: 'boolean' },
    clickable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

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
    children: 'Chip',
    size: 'md',
    color: 'default',
    variant: 'filled',
    removable: false,
    clickable: false,
    disabled: false,
  },
};

// ---------------------------------------------------------------------------
// 2. Colors -- all 5 color variants
// ---------------------------------------------------------------------------

export const Colors: Story = {
  name: 'Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All color variants</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {chipColors.map((color) => (
          <Chip key={color} color={color}>
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Chip>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Style Variants -- filled, outlined, subtle
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Style variants across colors</SectionLabel>
      {chipVariants.map((variant) => (
        <div key={variant} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text size="xs" color="tertiary" weight="semibold">{variant}</Text>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {chipColors.map((color) => (
              <Chip key={color} color={color} variant={variant}>
                {color}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Sizes -- sm, md, lg
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {chipSizes.map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Chip size={size} color="default">{size}</Chip>
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Sizes across colors</SectionLabel>
      {chipSizes.map((size) => (
        <div key={size} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text size="xs" color="tertiary" style={{ width: 30, textAlign: 'right', flexShrink: 0 }}>{size}</Text>
          {chipColors.map((color) => (
            <Chip key={color} size={size} color={color}>
              {color}
            </Chip>
          ))}
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Icons -- leading icon
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Leading icon</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip color="default" icon={<Tag size={14} />}>Tag</Chip>
        <Chip color="success" icon={<Check size={14} />}>Approved</Chip>
        <Chip color="danger" icon={<AlertCircle size={14} />}>Error</Chip>
        <Chip color="info" icon={<Info size={14} />}>Note</Chip>
        <Chip color="warning" icon={<Zap size={14} />}>Caution</Chip>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Icons across sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {chipSizes.map((size) => {
          const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;
          return (
            <Chip key={size} size={size} color="success" icon={<Star size={iconSize} />}>
              {size}
            </Chip>
          );
        })}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Removable -- with X button
// ---------------------------------------------------------------------------

export const Removable: Story = {
  name: 'Removable',
  render: () => {
    const RemovableDemo = () => {
      const [chips, setChips] = useState(['React', 'TypeScript', 'Design System', 'Storybook']);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel>Removable chips</SectionLabel>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {chips.map((label) => (
              <Chip
                key={label}
                color="info"
                removable
                onRemove={() => setChips((prev) => prev.filter((c) => c !== label))}
              >
                {label}
              </Chip>
            ))}
          </div>
          {chips.length === 0 && (
            <Text size="sm" color="tertiary">All chips removed. Refresh to reset.</Text>
          )}

          <div style={{ height: 8 }} />
          <SectionLabel>Removable across colors</SectionLabel>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {chipColors.map((color) => (
              <Chip key={color} color={color} removable onRemove={() => {}}>
                {color}
              </Chip>
            ))}
          </div>

          <div style={{ height: 8 }} />
          <SectionLabel>Removable across variants</SectionLabel>
          {chipVariants.map((variant) => (
            <div key={variant} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Text size="xs" color="tertiary" style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>{variant}</Text>
              <Chip color="danger" variant={variant} removable onRemove={() => {}}>
                Label
              </Chip>
            </div>
          ))}
        </div>
      );
    };
    return <RemovableDemo />;
  },
};

// ---------------------------------------------------------------------------
// 7. Clickable -- interactive chips
// ---------------------------------------------------------------------------

export const Clickable: Story = {
  name: 'Clickable',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Clickable chips</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {chipColors.map((color) => (
          <Chip key={color} color={color} clickable onClick={() => {}}>
            {color}
          </Chip>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Disabled -- dimmed and non-interactive
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Disabled chips</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {chipColors.map((color) => (
          <Chip key={color} color={color} disabled>
            {color}
          </Chip>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Disabled + removable</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip color="info" disabled removable onRemove={() => {}}>Disabled</Chip>
        <Chip color="danger" disabled removable onRemove={() => {}}>Disabled</Chip>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Composition -- real-world usage patterns
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>Filter tags</SectionLabel>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip color="info" variant="outlined" removable onRemove={() => {}} size="sm">JavaScript</Chip>
        <Chip color="info" variant="outlined" removable onRemove={() => {}} size="sm">TypeScript</Chip>
        <Chip color="success" variant="outlined" removable onRemove={() => {}} size="sm">Open Source</Chip>
        <Chip color="warning" variant="outlined" removable onRemove={() => {}} size="sm">Beta</Chip>
      </div>

      <SectionLabel>Status indicators</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip color="success" icon={<Check size={14} />}>Passing</Chip>
        <Chip color="warning" icon={<Zap size={14} />}>Flaky</Chip>
        <Chip color="danger" icon={<AlertCircle size={14} />}>3 Errors</Chip>
      </div>

      <SectionLabel>Subtle variant set</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {chipColors.map((color) => (
          <Chip key={color} color={color} variant="subtle" icon={<Star size={14} />}>
            {color}
          </Chip>
        ))}
      </div>

      <SectionLabel>Mixed sizes and variants</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip size="sm" color="default" variant="outlined">Small</Chip>
        <Chip size="md" color="info" variant="filled" icon={<Info size={14} />}>Medium</Chip>
        <Chip size="lg" color="success" variant="subtle" removable onRemove={() => {}}>Large</Chip>
      </div>
    </div>
  ),
};
