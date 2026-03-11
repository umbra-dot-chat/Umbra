import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';
import { Text } from '../text';
import { componentSizes } from '@coexist/wisp-core/tokens/shared';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Spinner> = {
  title: 'Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...componentSizes] },
    label: { control: 'text' },
    color: { control: 'color' },
    trackColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default — playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <Spinner {...args} />,
};

// ---------------------------------------------------------------------------
// 2. Sizes — all 5 sizes in a row
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Spinner size={size} />
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. WithLabel — spinner with "Loading..." text
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Spinner with label</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <Spinner size="xs" label="Loading..." />
        <Spinner size="sm" label="Loading..." />
        <Spinner size="md" label="Loading..." />
        <Spinner size="lg" label="Loading data..." />
        <Spinner size="xl" label="Please wait..." />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. CustomColors — various custom spinner colors
// ---------------------------------------------------------------------------

export const CustomColors: Story = {
  name: 'Custom Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Custom indicator colors</SectionLabel>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#3B82F6" />
          <Text size="xs" color="tertiary">Blue</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#10B981" />
          <Text size="xs" color="tertiary">Green</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#F59E0B" />
          <Text size="xs" color="tertiary">Amber</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#EF4444" />
          <Text size="xs" color="tertiary">Red</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Spinner size="lg" color="#8B5CF6" />
          <Text size="xs" color="tertiary">Violet</Text>
        </div>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Custom track + indicator</SectionLabel>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <Spinner size="lg" color="#3B82F6" trackColor="#3B82F633" />
        <Spinner size="lg" color="#10B981" trackColor="#10B98133" />
        <Spinner size="lg" color="#EF4444" trackColor="#EF444433" />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. OnDarkSurface — spinner on dark card
// ---------------------------------------------------------------------------

export const OnDarkSurface: Story = {
  name: 'On Dark Surface',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>On dark card</SectionLabel>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 32,
          borderRadius: 12,
          backgroundColor: '#161A24',
          border: '1px solid #202531',
        }}
      >
        <Spinner size="lg" color="#FFFFFF" trackColor="#37404F" />
        <Text size="sm" weight="medium" style={{ color: '#94A0B8' }}>
          Loading content...
        </Text>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>On light card</SectionLabel>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 32,
          borderRadius: 12,
          backgroundColor: '#F7F8FA',
          border: '1px solid #E0E4EB',
        }}
      >
        <Spinner size="lg" color="#0F1219" trackColor="#E0E4EB" />
        <Text size="sm" weight="medium" style={{ color: '#7B8698' }}>
          Loading content...
        </Text>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Inline — small spinner inline with text
// ---------------------------------------------------------------------------

export const Inline: Story = {
  name: 'Inline',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Inline with text</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Spinner size="xs" />
        <Text size="sm" color="secondary">Saving changes...</Text>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Spinner size="xs" />
        <Text size="sm" color="secondary">Uploading file...</Text>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Spinner size="sm" />
        <Text size="md" color="primary">Syncing data</Text>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. ButtonLoading — composition showing spinner inside a button-like state
// ---------------------------------------------------------------------------

export const ButtonLoading: Story = {
  name: 'Button Loading',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Button loading states</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Primary button loading */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            color: '#0F1219',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'not-allowed',
            opacity: 0.8,
          }}
        >
          <Spinner size="xs" color="#0F1219" trackColor="#0F121933" />
          <span>Saving...</span>
        </div>

        {/* Secondary button loading */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            backgroundColor: 'transparent',
            color: '#F7F8FA',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'not-allowed',
            opacity: 0.8,
            boxShadow: 'inset 0 0 0 1px #37404F',
          }}
        >
          <Spinner size="xs" color="#F7F8FA" trackColor="#37404F" />
          <span>Loading...</span>
        </div>

        {/* Destructive button loading */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'not-allowed',
            opacity: 0.8,
          }}
        >
          <Spinner size="xs" color="#FFFFFF" trackColor="#FFFFFF33" />
          <span>Deleting...</span>
        </div>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Icon-only button loading</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            cursor: 'not-allowed',
            opacity: 0.8,
          }}
        >
          <Spinner size="xs" color="#0F1219" trackColor="#0F121933" />
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'transparent',
            boxShadow: 'inset 0 0 0 1px #37404F',
            cursor: 'not-allowed',
            opacity: 0.8,
          }}
        >
          <Spinner size="xs" color="#F7F8FA" trackColor="#37404F" />
        </div>
      </div>
    </div>
  ),
};
