import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Spacer } from './Spacer';
import { spacerSizes } from '@coexist/wisp-core/types/Spacer.types';
import type { SpacerSize } from '@coexist/wisp-core/types/Spacer.types';
import { Stack, HStack } from '../stack';
import { Text } from '../../primitives/text';
import { useThemeColors } from '../../providers';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Spacer> = {
  title: 'Layouts/Spacer',
  component: Spacer,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...spacerSizes] },
    flex: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Spacer>;

// ---------------------------------------------------------------------------
// Helper — visual demo box
// ---------------------------------------------------------------------------

function DemoBox({ children, width }: { children?: React.ReactNode; width?: number }) {
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
// Helper — colored gap indicator
// ---------------------------------------------------------------------------

function GapIndicator({ size, label }: { size: SpacerSize; label: string }) {
  const themeColors = useThemeColors();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Text size="xs" color="secondary" style={{ width: 80, flexShrink: 0 }}>
        {label}
      </Text>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <DemoBox width={60}>A</DemoBox>
        <div style={{ backgroundColor: themeColors.accent.highlight, display: 'flex' }}>
          <Spacer size={size} />
        </div>
        <DemoBox width={60}>B</DemoBox>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Default (playground)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Fixed Sizes — show every spacing token as a colored gap between boxes
// ---------------------------------------------------------------------------

export const FixedSizes: Story = {
  name: 'Fixed Sizes',
  render: () => (
    <Stack gap="md">
      {spacerSizes.map((s) => (
        <GapIndicator key={s} size={s} label={`size="${s}"`} />
      ))}
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// 3. Flex Spacer — push items apart in a horizontal row
// ---------------------------------------------------------------------------

export const FlexSpacer: Story = {
  name: 'Flex Spacer',
  render: () => (
    <Stack gap="xl">
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>
          flex=true pushes items to opposite ends
        </Text>
        <HStack gap="none" align="center" style={{ width: '100%' }}>
          <DemoBox>Left</DemoBox>
          <Spacer flex />
          <DemoBox>Right</DemoBox>
        </HStack>
      </div>

      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>
          flex=2 vs flex=1 — proportional space
        </Text>
        <HStack gap="none" align="center" style={{ width: '100%' }}>
          <DemoBox>A</DemoBox>
          <Spacer flex={2} />
          <DemoBox>B</DemoBox>
          <Spacer flex={1} />
          <DemoBox>C</DemoBox>
        </HStack>
      </div>

      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>
          Header pattern — logo left, actions right
        </Text>
        <HStack gap="sm" align="center" style={{ width: '100%', padding: '8px 0' }}>
          <DemoBox>Logo</DemoBox>
          <Spacer flex />
          <DemoBox>Search</DemoBox>
          <DemoBox>Profile</DemoBox>
        </HStack>
      </div>
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// 4. Combined with Stack — vertical spacing between sections
// ---------------------------------------------------------------------------

export const CombinedWithStack: Story = {
  name: 'Combined with Stack',
  render: () => (
    <Stack gap="xl">
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>
          Vertical Stack with Spacer between sections
        </Text>
        <Stack gap="none">
          <DemoBox>Header</DemoBox>
          <Spacer size="lg" />
          <DemoBox>Main Content</DemoBox>
          <Spacer size="xl" />
          <DemoBox>Footer</DemoBox>
        </Stack>
      </div>

      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>
          Horizontal — fixed and flex spacers together
        </Text>
        <HStack gap="none" align="center" style={{ width: '100%' }}>
          <DemoBox>Nav</DemoBox>
          <Spacer size="md" />
          <DemoBox>Title</DemoBox>
          <Spacer flex />
          <DemoBox>Actions</DemoBox>
        </HStack>
      </div>
    </Stack>
  ),
};
