import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import { iconSizes as iconSizeOptions, iconColors } from '@coexist/wisp-core/types/Icon.types';
import { Text } from '../text';
import {
  Search,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Star,
  Info,
  Zap,
  Heart,
  Settings,
  Bell,
  User,
  Home,
  Mail,
  Lock,
  Eye,
  Download,
  Upload,
  Trash2,
  Edit3,
  Plus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Icon> = {
  title: 'Primitives/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...iconSizeOptions] },
    color: { control: 'select', options: ['currentColor', ...iconColors] },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Sizes — all 5 steps
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All sizes</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Icon icon={Star} size={size} color="primary" />
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Size comparison with text</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon={Star} size="xs" color="primary" />
          <Text size="xs">Extra small — 14px icon with xs text</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon={Star} size="sm" color="primary" />
          <Text size="sm">Small — 16px icon with sm text</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon={Star} size="md" color="primary" />
          <Text size="md">Medium — 20px icon with md text</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon={Star} size="lg" color="primary" />
          <Text size="lg">Large — 24px icon with lg text</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon={Star} size="xl" color="primary" />
          <Text size="xl">Extra large — 32px icon with xl text</Text>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Colors — all 10 semantic colors + currentColor
// ---------------------------------------------------------------------------

export const Colors: Story = {
  name: 'Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>currentColor (inherits from parent)</SectionLabel>
      <div style={{ display: 'flex', gap: 12 }}>
        <Text size="md" color="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon icon={Star} size="sm" />
          Inherits primary
        </Text>
        <Text size="md" color="error" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon icon={AlertCircle} size="sm" />
          Inherits error
        </Text>
        <Text size="md" color="success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon icon={CheckCircle} size="sm" />
          Inherits success
        </Text>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Neutral colors</SectionLabel>
      <div style={{ display: 'flex', gap: 16 }}>
        {(['primary', 'secondary', 'tertiary', 'disabled'] as const).map((c) => (
          <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon icon={Star} size="lg" color={c} />
            <Text size="xs" color="tertiary">{c}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Status colors</SectionLabel>
      <div style={{ display: 'flex', gap: 16 }}>
        {([
          { color: 'error' as const, icon: AlertCircle },
          { color: 'warning' as const, icon: Info },
          { color: 'success' as const, icon: CheckCircle },
        ]).map(({ color: c, icon: I }) => (
          <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon icon={I} size="lg" color={c} />
            <Text size="xs" color="tertiary">{c}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Special</SectionLabel>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Icon icon={Zap} size="lg" color="brand" />
          <Text size="xs" color="tertiary">brand</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, backgroundColor: '#0F1219', padding: '8px 12px', borderRadius: 6 }}>
          <Icon icon={Star} size="lg" color="white" />
          <Text size="xs" color="white">white</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Icon icon={Star} size="lg" color="inverse" />
          <Text size="xs" color="tertiary">inverse</Text>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Skeleton Loading
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Skeleton at different sizes</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon icon={Star} size={size} skeleton />
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Skeleton vs loaded</SectionLabel>
      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <Text size="xs" color="tertiary" weight="medium">Loading</Text>
          <Icon icon={Star} size="lg" skeleton />
          <Icon icon={Bell} size="md" skeleton />
          <Icon icon={Settings} size="md" skeleton />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <Text size="xs" color="tertiary" weight="medium">Loaded</Text>
          <Icon icon={Star} size="lg" color="primary" />
          <Icon icon={Bell} size="md" color="primary" />
          <Icon icon={Settings} size="md" color="secondary" />
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Stroke Width
// ---------------------------------------------------------------------------

export const StrokeWidth: Story = {
  name: 'Stroke Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>Varying stroke weights</SectionLabel>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {[1, 1.5, 2, 2.5, 3].map((sw) => (
          <div key={sw} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon icon={Star} size="lg" strokeWidth={sw} color="primary" />
            <Text size="xs" color="tertiary">{sw}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Icon Library Showcase
// ---------------------------------------------------------------------------

export const Library: Story = {
  name: 'Library',
  render: () => {
    const icons = [
      { name: 'Search', comp: Search },
      { name: 'Home', comp: Home },
      { name: 'User', comp: User },
      { name: 'Settings', comp: Settings },
      { name: 'Bell', comp: Bell },
      { name: 'Mail', comp: Mail },
      { name: 'Heart', comp: Heart },
      { name: 'Star', comp: Star },
      { name: 'Lock', comp: Lock },
      { name: 'Eye', comp: Eye },
      { name: 'Download', comp: Download },
      { name: 'Upload', comp: Upload },
      { name: 'Trash2', comp: Trash2 },
      { name: 'Edit3', comp: Edit3 },
      { name: 'Plus', comp: Plus },
      { name: 'ArrowRight', comp: ArrowRight },
      { name: 'AlertCircle', comp: AlertCircle },
      { name: 'CheckCircle', comp: CheckCircle },
      { name: 'Info', comp: Info },
      { name: 'Zap', comp: Zap },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>Lucide React icons via Icon primitive</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {icons.map(({ name, comp }) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '12px 8px',
                border: '1px solid #37404F',
                borderRadius: 8,
              }}
            >
              <Icon icon={comp} size="lg" color="primary" />
              <Text size="xs" color="tertiary">{name}</Text>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 6. With Text — composition patterns
// ---------------------------------------------------------------------------

export const WithText: Story = {
  name: 'With Text',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Icon + Text composition</SectionLabel>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon={Search} size="sm" color="secondary" />
        <Text size="md">Search results</Text>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon={AlertCircle} size="sm" color="error" />
        <Text size="sm" color="error" weight="medium">Error: Invalid email address</Text>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon={CheckCircle} size="sm" color="success" />
        <Text size="sm" color="success" weight="medium">Changes saved successfully</Text>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon={Info} size="sm" color="secondary" />
        <Text size="sm" color="secondary">Additional information available</Text>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Navigation items</SectionLabel>

      {[
        { icon: Home, label: 'Dashboard', active: true },
        { icon: User, label: 'Profile', active: false },
        { icon: Settings, label: 'Settings', active: false },
        { icon: Bell, label: 'Notifications', active: false },
      ].map(({ icon: I, label, active }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: active ? '#202531' : 'transparent',
            cursor: 'pointer',
          }}
        >
          <Icon icon={I} size="sm" color={active ? 'white' : 'tertiary'} />
          <Text size="sm" weight={active ? 'medium' : 'regular'} color={active ? 'white' : 'secondary'}>
            {label}
          </Text>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Accessibility
// ---------------------------------------------------------------------------

export const Accessibility: Story = {
  name: 'Accessibility',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionLabel>Decorative icons (aria-hidden)</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon={Star} size="md" color="primary" />
        <Text size="md">This icon is decorative — hidden from screen readers</Text>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Semantic icons (aria-label)</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon={AlertCircle} size="md" color="error" label="Error" />
        <Text size="md">This icon has an accessible label</Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon icon={CheckCircle} size="md" color="success" label="Success" />
        <Text size="md">Screen reader announces &quot;Success&quot;</Text>
      </div>
    </div>
  ),
};
