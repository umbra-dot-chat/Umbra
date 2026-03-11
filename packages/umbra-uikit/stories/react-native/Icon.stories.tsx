import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@wisp-ui/react-native';
import {
  Search,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Heart,
  Settings,
  Bell,
  Home,
} from 'lucide-react';

const meta: Meta<typeof Icon> = {
  title: 'React Native/Primitives/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'disabled', 'white', 'inverse', 'error', 'warning', 'success', 'brand'],
    },
    strokeWidth: { control: { type: 'range', min: 1, max: 3, step: 0.5 } },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    icon: Star,
    size: 'md',
    color: 'primary',
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>All sizes</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Icon icon={Star} size={size} color="primary" />
            <span style={{ fontSize: 10, color: '#94A0B8' }}>{size}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Colors
// ---------------------------------------------------------------------------

export const Colors: Story = {
  name: 'Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Neutral</div>
      <div style={{ display: 'flex', gap: 16 }}>
        {(['primary', 'secondary', 'tertiary', 'disabled'] as const).map((c) => (
          <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon icon={Star} size="lg" color={c} />
            <span style={{ fontSize: 10, color: '#94A0B8' }}>{c}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Status</div>
      <div style={{ display: 'flex', gap: 16 }}>
        {([
          { color: 'error' as const, icon: AlertCircle },
          { color: 'warning' as const, icon: Info },
          { color: 'success' as const, icon: CheckCircle },
        ]).map(({ color: c, icon: I }) => (
          <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon icon={I} size="lg" color={c} />
            <span style={{ fontSize: 10, color: '#94A0B8' }}>{c}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Special</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Icon icon={Zap} size="lg" color="brand" />
          <span style={{ fontSize: 10, color: '#94A0B8' }}>brand</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, backgroundColor: '#0F1219', padding: '8px 12px', borderRadius: 6 }}>
          <Icon icon={Star} size="lg" color="white" />
          <span style={{ fontSize: 10, color: '#94A0B8' }}>white</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Icon icon={Star} size="lg" color="inverse" />
          <span style={{ fontSize: 10, color: '#94A0B8' }}>inverse</span>
        </div>
      </div>
    </div>
  ),
};
