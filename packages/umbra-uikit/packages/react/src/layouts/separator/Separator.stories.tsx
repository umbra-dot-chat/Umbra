import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './Separator';
import { separatorOrientations, separatorVariants, separatorSpacings } from '@coexist/wisp-core/types/Separator.types';
import { Text } from '../../primitives/text';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Separator> = {
  title: 'Layouts/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: [...separatorOrientations] },
    variant: { control: 'select', options: [...separatorVariants] },
    spacing: { control: 'select', options: [...separatorSpacings] },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

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
    orientation: 'horizontal',
    variant: 'subtle',
    spacing: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Variants — subtle vs strong
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>Subtle (default)</SectionLabel>
      <Separator variant="subtle" />

      <SectionLabel>Strong</SectionLabel>
      <Separator variant="strong" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Vertical — used between inline items
// ---------------------------------------------------------------------------

export const Vertical: Story = {
  name: 'Vertical',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>Vertical separator between items</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', height: 32 }}>
        <Text size="sm">Item A</Text>
        <Separator orientation="vertical" spacing="md" />
        <Text size="sm">Item B</Text>
        <Separator orientation="vertical" spacing="md" />
        <Text size="sm">Item C</Text>
      </div>

      <SectionLabel>Vertical with strong variant</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', height: 32 }}>
        <Text size="sm">Left</Text>
        <Separator orientation="vertical" variant="strong" spacing="lg" />
        <Text size="sm">Right</Text>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. WithLabel — centered label breaking the line
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>Text label</SectionLabel>
      <Separator label="OR" />

      <SectionLabel>Longer text label</SectionLabel>
      <Separator label="Continue with email" />

      <SectionLabel>Strong variant with label</SectionLabel>
      <Separator label="Section" variant="strong" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Spacing — all spacing options
// ---------------------------------------------------------------------------

export const Spacing: Story = {
  name: 'Spacing',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {separatorSpacings.map((sp) => (
        <React.Fragment key={sp}>
          <Text size="xs" color="tertiary">spacing=&quot;{sp}&quot;</Text>
          <Separator spacing={sp} />
          <Text size="xs" color="tertiary">Content below</Text>
          <div style={{ height: 16 }} />
        </React.Fragment>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Thickness — override line height with shared token
// ---------------------------------------------------------------------------

export const Thickness: Story = {
  name: 'Thickness',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>Horizontal thickness</SectionLabel>
      {(['thin', 'regular', 'medium', 'thick', 'heavy'] as const).map((t) => (
        <div key={t}>
          <Text size="xs" color="tertiary" style={{ marginBottom: 4 }}>{t}</Text>
          <Separator thickness={t} spacing="none" />
        </div>
      ))}

      <SectionLabel>Vertical thickness</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
        {(['thin', 'regular', 'medium', 'thick', 'heavy'] as const).map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && <div style={{ width: 16 }} />}
            <Text size="xs" color="tertiary">{t}</Text>
            <Separator orientation="vertical" thickness={t} spacing="sm" />
          </React.Fragment>
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
      <SectionLabel>Form section divider</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Text size="sm">Email: user@example.com</Text>
        <Separator spacing="sm" />
        <Text size="sm">Password: ••••••••</Text>
        <Separator label="OR" spacing="md" />
        <Text size="sm" color="secondary">Sign in with SSO</Text>
      </div>

      <SectionLabel>Navigation bar with vertical separators</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
        <Text size="sm" weight="semibold">Dashboard</Text>
        <Separator orientation="vertical" spacing="md" />
        <Text size="sm">Settings</Text>
        <Separator orientation="vertical" spacing="md" />
        <Text size="sm">Profile</Text>
        <Separator orientation="vertical" spacing="md" />
        <Text size="sm" color="secondary">Logout</Text>
      </div>

      <SectionLabel>Mixed spacing in a list</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Text size="sm">First item</Text>
        <Separator spacing="sm" variant="subtle" />
        <Text size="sm">Second item</Text>
        <Separator spacing="sm" variant="subtle" />
        <Text size="sm">Third item</Text>
      </div>
    </div>
  ),
};
