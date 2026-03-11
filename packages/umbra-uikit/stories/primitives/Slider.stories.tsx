import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Slider> = {
  title: 'React/Primitives/Slider',
  component: Slider,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    skeleton: false,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 50,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    showValue: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    defaultValue: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

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
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Slider {...args} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size}>
          <SectionLabel>{size}</SectionLabel>
          <Slider size={size} defaultValue={60} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Slider label="Volume" defaultValue={75} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Value Display
// ---------------------------------------------------------------------------

export const WithValueDisplay: Story = {
  name: 'With Value Display',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Slider label="Brightness" showValue defaultValue={40} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Custom Format
// ---------------------------------------------------------------------------

export const CustomFormat: Story = {
  name: 'Custom Format',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SectionLabel>Percentage</SectionLabel>
        <Slider
          label="Opacity"
          showValue
          defaultValue={80}
          formatValue={(v) => `${v}%`}
        />
      </div>
      <div>
        <SectionLabel>Currency</SectionLabel>
        <Slider
          label="Price"
          showValue
          min={0}
          max={500}
          step={5}
          defaultValue={250}
          formatValue={(v) => `$${v}`}
        />
      </div>
      <div>
        <SectionLabel>Temperature</SectionLabel>
        <Slider
          label="Temperature"
          showValue
          min={60}
          max={90}
          step={1}
          defaultValue={72}
          formatValue={(v) => `${v}\u00B0F`}
        />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Step
// ---------------------------------------------------------------------------

export const StepIncrement: Story = {
  name: 'Step',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Slider
        label="Step = 10"
        showValue
        step={10}
        defaultValue={50}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Custom Range
// ---------------------------------------------------------------------------

export const CustomRange: Story = {
  name: 'Custom Range',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Slider
        label="Range (-50 to 50)"
        showValue
        min={-50}
        max={50}
        defaultValue={0}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SectionLabel>Disabled at 30</SectionLabel>
        <Slider disabled defaultValue={30} label="Disabled" showValue />
      </div>
      <div>
        <SectionLabel>Disabled at 70</SectionLabel>
        <Slider disabled defaultValue={70} label="Disabled" showValue />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Thickness — override track height with shared token
// ---------------------------------------------------------------------------

export const Thickness: Story = {
  name: 'Thickness',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['thin', 'regular', 'medium', 'thick', 'heavy'] as const).map((t) => (
        <div key={t}>
          <SectionLabel>{t}</SectionLabel>
          <Slider thickness={t} defaultValue={60} />
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 10. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Slider key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 10. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [value, setValue] = useState(50);
      return (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Slider
            value={value}
            onChange={setValue}
            label="Controlled Slider"
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
// 11. Composition — settings panel
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const SettingsPanel = () => {
      const [volume, setVolume] = useState(65);
      const [brightness, setBrightness] = useState(80);
      const [contrast, setContrast] = useState(50);

      return (
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            padding: 24,
            borderRadius: 12,
            backgroundColor: '#161A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Text size="md" weight="semibold" style={{ color: '#F7F8FA', marginBottom: 4 }}>
            Display Settings
          </Text>
          <Text size="xs" style={{ color: '#667085', marginBottom: 24 }}>
            Adjust display preferences
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Slider
              value={volume}
              onChange={setVolume}
              label="Volume"
              showValue
              formatValue={(v) => `${v}%`}
              size="md"
            />
            <Slider
              value={brightness}
              onChange={setBrightness}
              label="Brightness"
              showValue
              formatValue={(v) => `${v}%`}
              size="md"
            />
            <Slider
              value={contrast}
              onChange={setContrast}
              label="Contrast"
              showValue
              formatValue={(v) => `${v}%`}
              size="md"
            />
          </div>
        </div>
      );
    };
    return <SettingsPanel />;
  },
};
