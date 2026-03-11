import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Rating } from './Rating';
import { Text } from '../text';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Rating> = {
  title: 'Primitives/Rating',
  component: Rating,
  tags: ['autodocs'],
  args: {
    size: 'md',
    max: 5,
    defaultValue: 0,
    allowHalf: false,
    readOnly: false,
    disabled: false,
    showValue: false,
    skeleton: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    max: { control: 'number' },
    defaultValue: { control: 'number' },
    allowHalf: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showValue: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Rating>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="medium" as="div" style={{ marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <Rating {...args} />,
};

// ---------------------------------------------------------------------------
// 2. ReadOnly
// ---------------------------------------------------------------------------

export const ReadOnly: Story = {
  name: 'ReadOnly',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <SectionLabel>3 stars (read-only)</SectionLabel>
        <Rating value={3} readOnly />
      </div>
      <div>
        <SectionLabel>4.5 stars (read-only, half)</SectionLabel>
        <Rating value={4.5} readOnly allowHalf />
      </div>
      <div>
        <SectionLabel>2 stars (read-only, with value)</SectionLabel>
        <Rating value={2} readOnly showValue />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. HalfStars
// ---------------------------------------------------------------------------

export const HalfStars: Story = {
  name: 'HalfStars',
  render: () => {
    const HalfStarsDemo = () => {
      const [value, setValue] = useState(2.5);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionLabel>Click left/right half of a star</SectionLabel>
          <Rating value={value} onChange={setValue} allowHalf showValue size="lg" />
          <Text size="sm" color="secondary">
            Current value: {value}
          </Text>
        </div>
      );
    };
    return <HalfStarsDemo />;
  },
};

// ---------------------------------------------------------------------------
// 4. AllSizes
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'AllSizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <SectionLabel>{size}</SectionLabel>
          <Rating size={size} defaultValue={3} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. WithValue
// ---------------------------------------------------------------------------

export const WithValue: Story = {
  name: 'WithValue',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <SectionLabel>Default with value label</SectionLabel>
        <Rating defaultValue={4} showValue />
      </div>
      <div>
        <SectionLabel>Half-star with value label</SectionLabel>
        <Rating value={3.5} allowHalf readOnly showValue />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <SectionLabel>Disabled at 3</SectionLabel>
        <Rating value={3} disabled showValue />
      </div>
      <div>
        <SectionLabel>Disabled at 0</SectionLabel>
        <Rating value={0} disabled />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [value, setValue] = useState(3);
      return (
        <div>
          <Rating
            value={value}
            onChange={setValue}
            showValue
            size="lg"
          />
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text size="sm" color="secondary">
              Current value: {value}
            </Text>
          </div>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

// ---------------------------------------------------------------------------
// 8. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <SectionLabel>{size}</SectionLabel>
          <Rating skeleton size={size} />
        </div>
      ))}
    </div>
  ),
};
