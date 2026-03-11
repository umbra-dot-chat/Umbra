import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@wisp-ui/react-native';
import { buttonVariants, buttonShapes, componentSizes } from '@wisp-ui/react';

const meta: Meta<typeof Button> = {
  title: 'React Native/Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...buttonVariants] },
    size: { control: 'select', options: [...componentSizes] },
    shape: { control: 'select', options: [...buttonShapes] },
    disabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    shape: 'rounded',
  },
};

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Monochrome</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Destructive</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="destructive">Destructive</Button>
        <Button variant="destructive-outline">Outline</Button>
        <Button variant="destructive-ghost">Ghost</Button>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Success</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="success">Success</Button>
        <Button variant="success-outline">Outline</Button>
        <Button variant="success-ghost">Ghost</Button>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Warning</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="warning">Warning</Button>
        <Button variant="warning-outline">Outline</Button>
        <Button variant="warning-ghost">Ghost</Button>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Brand</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="brand">Brand</Button>
        <Button variant="brand-outline">Outline</Button>
        <Button variant="brand-ghost">Ghost</Button>
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
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Shapes
// ---------------------------------------------------------------------------

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button shape="rounded">Rounded</Button>
      <Button shape="pill">Pill</Button>
      <Button shape="square">Square</Button>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. States
// ---------------------------------------------------------------------------

export const States: Story = {
  name: 'States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button>Normal</Button>
        <Button disabled>Disabled</Button>
        <Button isLoading>Loading</Button>
        <Button isLoading>Saving...</Button>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 320 }}>
      <Button fullWidth>Full Width Primary</Button>
      <Button fullWidth variant="secondary">Full Width Secondary</Button>
      <Button fullWidth variant="destructive">Full Width Destructive</Button>
    </div>
  ),
};
