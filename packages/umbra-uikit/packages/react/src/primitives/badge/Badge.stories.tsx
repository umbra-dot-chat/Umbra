import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { badgeVariants, badgeSizes, badgeShapes } from '@coexist/wisp-core/types/Badge.types';
import { Text } from '../text';
import { Star, X, Check, AlertCircle, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...badgeVariants] },
    size: { control: 'select', options: [...badgeSizes] },
    shape: { control: 'select', options: [...badgeShapes] },
    dot: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

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
    children: 'Badge',
    size: 'md',
    variant: 'default',
    shape: 'pill',
    dot: false,
    skeleton: false,
  },
};

// ---------------------------------------------------------------------------
// 2. Variants — all 5 color variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All variants</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {badgeVariants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </Badge>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes — sm, md, lg
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {badgeSizes.map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Badge size={size} variant="default">{size}</Badge>
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Sizes across variants</SectionLabel>
      {badgeSizes.map((size) => (
        <div key={size} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text size="xs" color="tertiary" style={{ width: 30, textAlign: 'right', flexShrink: 0 }}>{size}</Text>
          {badgeVariants.map((variant) => (
            <Badge key={variant} size={size} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Shapes — pill vs badge
// ---------------------------------------------------------------------------

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Shape variants</SectionLabel>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {badgeShapes.map((shape) => (
          <div key={shape} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Badge shape={shape} variant="default">Label</Badge>
            <Text size="xs" color="tertiary">{shape}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Shapes across variants</SectionLabel>
      {badgeShapes.map((shape) => (
        <div key={shape} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text size="xs" color="tertiary" style={{ width: 50, textAlign: 'right', flexShrink: 0 }}>{shape}</Text>
          {badgeVariants.map((variant) => (
            <Badge key={variant} shape={shape} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Dot — all variants with dot indicator
// ---------------------------------------------------------------------------

export const WithDot: Story = {
  name: 'With Dot',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Dot indicator across variants</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {badgeVariants.map((variant) => (
          <Badge key={variant} variant={variant} dot>
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </Badge>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Dot at different sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {badgeSizes.map((size) => (
          <Badge key={size} size={size} variant="success" dot>
            Active
          </Badge>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. With Icons — leading and trailing icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Leading icon</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge variant="default" icon={Star}>Featured</Badge>
        <Badge variant="success" icon={Check}>Approved</Badge>
        <Badge variant="danger" icon={AlertCircle}>Error</Badge>
        <Badge variant="info" icon={Info}>Note</Badge>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Trailing icon</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge variant="default" trailingIcon={X}>Removable</Badge>
        <Badge variant="success" trailingIcon={Check}>Done</Badge>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Both icons</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Badge variant="info" icon={Star} trailingIcon={X}>Premium</Badge>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Icons across sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {badgeSizes.map((size) => (
          <Badge key={size} size={size} variant="success" icon={Check}>
            {size}
          </Badge>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Composition — real-world usage patterns
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>Tags on a card</SectionLabel>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge variant="info" size="sm">React</Badge>
        <Badge variant="info" size="sm">TypeScript</Badge>
        <Badge variant="success" size="sm">Open Source</Badge>
        <Badge variant="warning" size="sm">Beta</Badge>
      </div>

      <SectionLabel>Status indicators</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge variant="success" dot>Online</Badge>
        <Badge variant="warning" dot>Away</Badge>
        <Badge variant="danger" dot>Offline</Badge>
        <Badge variant="default" dot>Unknown</Badge>
      </div>

      <SectionLabel>Mixed row with labels</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge variant="danger" icon={AlertCircle} size="sm">3 errors</Badge>
        <Badge variant="warning" size="sm">12 warnings</Badge>
        <Badge variant="success" icon={Check} size="sm">Build passing</Badge>
      </div>

      <SectionLabel>Skeleton loading</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Badge skeleton size="sm">placeholder</Badge>
        <Badge skeleton size="md">placeholder</Badge>
        <Badge skeleton size="lg">placeholder</Badge>
      </div>
    </div>
  ),
};
