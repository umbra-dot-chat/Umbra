import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Indicator, Avatar } from '@wisp-ui/react-native';

const meta: Meta<typeof Indicator> = {
  title: 'React Native/Primitives/Indicator',
  component: Indicator,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['neutral', 'success', 'warning', 'danger', 'info'] },
    state: { control: 'select', options: ['idle', 'active', 'inactive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Indicator>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    variant: 'success',
    state: 'idle',
    size: 'sm',
  },
};

// ---------------------------------------------------------------------------
// 2. Statuses (variants)
// ---------------------------------------------------------------------------

export const Statuses: Story = {
  name: 'Statuses',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Variants</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Indicator variant="neutral" />
          <span style={{ fontSize: 13, color: '#94A0B8' }}>Neutral</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Indicator variant="success" />
          <span style={{ fontSize: 13, color: '#94A0B8' }}>Success</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Indicator variant="warning" />
          <span style={{ fontSize: 13, color: '#94A0B8' }}>Warning</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Indicator variant="danger" />
          <span style={{ fontSize: 13, color: '#94A0B8' }}>Danger</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Indicator variant="info" />
          <span style={{ fontSize: 13, color: '#94A0B8' }}>Info</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>States</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Indicator variant="success" state="idle" />
          <span style={{ fontSize: 13, color: '#94A0B8' }}>Idle</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Indicator variant="success" state="active" />
          <span style={{ fontSize: 13, color: '#94A0B8' }}>Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Indicator variant="success" state="inactive" />
          <span style={{ fontSize: 13, color: '#94A0B8' }}>Inactive</span>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Positions (all variant x state matrix)
// ---------------------------------------------------------------------------

export const Positions: Story = {
  name: 'Positions',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Size Scale</div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Indicator variant="success" size={size} />
            <span style={{ fontSize: 13, color: '#94A0B8' }}>{size}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Variant x State Matrix</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(['neutral', 'success', 'warning', 'danger', 'info'] as const).map((variant) => (
          <div key={variant} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 60, fontSize: 11, color: '#94A0B8' }}>{variant}</div>
            <Indicator variant={variant} state="idle" size="md" />
            <Indicator variant={variant} state="active" size="md" />
            <Indicator variant={variant} state="inactive" size="md" />
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. WithAvatar
// ---------------------------------------------------------------------------

export const WithAvatar: Story = {
  name: 'With Avatar',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Avatar + Indicator</div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Avatar name="Alice" size="md" />
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <Indicator variant="success" state="idle" size="sm" />
          </div>
        </div>

        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Avatar name="Bob" size="md" />
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <Indicator variant="warning" state="active" size="sm" />
          </div>
        </div>

        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Avatar name="Carol" size="md" />
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <Indicator variant="danger" state="idle" size="sm" />
          </div>
        </div>

        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Avatar name="Dan" size="md" />
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <Indicator variant="neutral" state="inactive" size="sm" />
          </div>
        </div>
      </div>
    </div>
  ),
};
