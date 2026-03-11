import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Center } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { useThemeColors } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Center> = {
  title: 'React/Layouts/Center',
  component: Center,
  tags: ['autodocs'],
  argTypes: {
    inline: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Center>;

// ---------------------------------------------------------------------------
// Helper — visual box
// ---------------------------------------------------------------------------

function DemoBox({ children, width, height }: { children?: React.ReactNode; width?: number | string; height?: number | string }) {
  const themeColors = useThemeColors();
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: themeColors.background.surface,
        border: `1px solid ${themeColors.border.subtle}`,
        color: themeColors.text.onRaised,
        fontSize: 14,
        fontWeight: 500,
        width: width ?? undefined,
        height: height ?? undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Default — centered text in a fixed-height container
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <DemoBox width="100%" height={200}>
      <Center style={{ width: '100%', height: '100%' }}>
        <Text size="md" weight="semibold">Centered content</Text>
      </Center>
    </DemoBox>
  ),
};

// ---------------------------------------------------------------------------
// 2. Inline — inline-flex variant
// ---------------------------------------------------------------------------

export const Inline: Story = {
  name: 'Inline',
  render: () => {
    const themeColors = useThemeColors();
    return (
      <div>
        <Text size="sm" color="secondary" style={{ marginBottom: 8 }} as="div">
          Inline centers sit within a line of text:
        </Text>
        <div style={{ fontSize: 14 }}>
          Before
          <Center
            inline
            style={{
              width: 80,
              height: 32,
              marginLeft: 8,
              marginRight: 8,
              borderRadius: 6,
              backgroundColor: themeColors.background.surface,
              border: `1px solid ${themeColors.border.subtle}`,
              color: themeColors.text.onRaised,
            }}
          >
            <Text size="xs" weight="semibold">Tag</Text>
          </Center>
          After
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. WithIconAndText — icon alongside centered text
// ---------------------------------------------------------------------------

export const WithIconAndText: Story = {
  name: 'With Icon and Text',
  render: () => {
    const themeColors = useThemeColors();
    return (
      <DemoBox width={240} height={120}>
        <Center style={{ width: '100%', height: '100%', gap: 8 }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={themeColors.text.onRaised}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <Text size="sm" weight="semibold">Verified</Text>
        </Center>
      </DemoBox>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. CenteringInAvailableSpace — fills remaining space
// ---------------------------------------------------------------------------

export const CenteringInAvailableSpace: Story = {
  name: 'Centering in Available Space',
  render: () => {
    const themeColors = useThemeColors();
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 320,
          borderRadius: 8,
          border: `1px solid ${themeColors.border.subtle}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: themeColors.background.surface,
            borderBottom: `1px solid ${themeColors.border.subtle}`,
          }}
        >
          <Text size="sm" weight="semibold">Header</Text>
        </div>

        <Center style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" weight="semibold" as="div" style={{ marginBottom: 4 }}>
              No items yet
            </Text>
            <Text size="sm" color="secondary" as="div">
              Content is centered in the remaining space.
            </Text>
          </div>
        </Center>

        <div
          style={{
            padding: '12px 16px',
            backgroundColor: themeColors.background.surface,
            borderTop: `1px solid ${themeColors.border.subtle}`,
          }}
        >
          <Text size="sm" weight="semibold">Footer</Text>
        </div>
      </div>
    );
  },
};
