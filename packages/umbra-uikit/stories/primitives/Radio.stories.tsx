import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Radio, RadioGroup } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof RadioGroup> = {
  title: 'React/Primitives/Radio',
  component: RadioGroup,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    error: false,
    skeleton: false,
    orientation: 'vertical',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
    <Text size="xs" color="tertiary" weight="medium" style={{ width: 100, flexShrink: 0, textAlign: 'right', paddingTop: 2 }}>
      {label}
    </Text>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => (
    <RadioGroup {...args} defaultValue="option-1">
      <Radio value="option-1" label="Option 1" />
      <Radio value="option-2" label="Option 2" />
      <Radio value="option-3" label="Option 3" />
    </RadioGroup>
  ),
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Row key={size} label={size}>
          <RadioGroup size={size} defaultValue="a" orientation="horizontal">
            <Radio value="a" label={`Selected ${size}`} />
            <Radio value="b" label={`Unselected ${size}`} />
          </RadioGroup>
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Descriptions
// ---------------------------------------------------------------------------

export const WithDescriptions: Story = {
  name: 'With Descriptions',
  render: () => (
    <RadioGroup size="lg" defaultValue="standard">
      <Radio
        value="standard"
        label="Standard shipping"
        description="Delivery in 5-7 business days"
      />
      <Radio
        value="express"
        label="Express shipping"
        description="Delivery in 2-3 business days"
      />
      <Radio
        value="overnight"
        label="Overnight shipping"
        description="Delivery by tomorrow at 10:00 AM"
      />
    </RadioGroup>
  ),
};

// ---------------------------------------------------------------------------
// 4. Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => (
    <RadioGroup orientation="horizontal" defaultValue="monthly" size="md">
      <Radio value="monthly" label="Monthly" />
      <Radio value="quarterly" label="Quarterly" />
      <Radio value="yearly" label="Yearly" />
    </RadioGroup>
  ),
};

// ---------------------------------------------------------------------------
// 5. Error
// ---------------------------------------------------------------------------

export const Error: Story = {
  name: 'Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <RadioGroup error size="md">
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
        <Radio value="c" label="Option C" />
      </RadioGroup>
      <RadioGroup error size="lg" defaultValue="a">
        <Radio
          value="a"
          label="Selected with error"
          description="This option has a validation issue."
        />
        <Radio value="b" label="Unselected with error" />
      </RadioGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Text size="xs" color="tertiary" weight="medium" style={{ marginBottom: 8 }}>
          Full group disabled
        </Text>
        <RadioGroup disabled defaultValue="a" size="md">
          <Radio value="a" label="Selected disabled" />
          <Radio value="b" label="Unselected disabled" />
          <Radio value="c" label="Another disabled" />
        </RadioGroup>
      </div>
      <div>
        <Text size="xs" color="tertiary" weight="medium" style={{ marginBottom: 8 }}>
          Individual item disabled
        </Text>
        <RadioGroup defaultValue="a" size="md">
          <Radio value="a" label="Enabled option" />
          <Radio value="b" label="Disabled option" disabled />
          <Radio value="c" label="Enabled option" />
        </RadioGroup>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <RadioGroup skeleton size="md">
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
        <Radio value="c" label="Option C" />
      </RadioGroup>
      <RadioGroup skeleton size="lg" orientation="horizontal">
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [selected, setSelected] = useState('react');
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <RadioGroup value={selected} onChange={setSelected} size="lg">
            <Radio value="react" label="React" description="A JavaScript library for building user interfaces" />
            <Radio value="vue" label="Vue" description="The progressive JavaScript framework" />
            <Radio value="svelte" label="Svelte" description="Cybernetically enhanced web apps" />
            <Radio value="angular" label="Angular" description="The modern web developer's platform" />
          </RadioGroup>
          <Text size="sm" color="secondary">
            Selected: {selected}
          </Text>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};
