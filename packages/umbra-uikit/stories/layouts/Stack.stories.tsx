import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stack, HStack, VStack } from '@wisp-ui/react';
import { stackDirections, stackAligns, stackJustifys } from '@wisp-ui/react';
import type { StackGap } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { useThemeColors } from '@wisp-ui/react';

const meta: Meta<typeof Stack> = {
  title: 'React/Layouts/Stack',
  component: Stack,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: [...stackDirections] },
    gap: {
      control: 'select',
      options: ['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    align: { control: 'select', options: [...stackAligns] },
    justify: { control: 'select', options: [...stackJustifys] },
    wrap: { control: 'boolean' },
    reverse: { control: 'boolean' },
    divider: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

// ---------------------------------------------------------------------------
// Helper — visual box
// ---------------------------------------------------------------------------

function DemoBox({ children, width, height }: { children?: React.ReactNode; width?: number; height?: number }) {
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
// Default (Vertical)
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <Stack gap="md">
      <DemoBox>Item 1</DemoBox>
      <DemoBox>Item 2</DemoBox>
      <DemoBox>Item 3</DemoBox>
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// Directions
// ---------------------------------------------------------------------------

export const Directions: Story = {
  name: 'Directions',
  render: () => (
    <Stack gap="xl">
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>Vertical (default)</Text>
        <Stack gap="sm">
          <DemoBox>One</DemoBox>
          <DemoBox>Two</DemoBox>
          <DemoBox>Three</DemoBox>
        </Stack>
      </div>
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>Horizontal</Text>
        <HStack gap="sm">
          <DemoBox>One</DemoBox>
          <DemoBox>Two</DemoBox>
          <DemoBox>Three</DemoBox>
        </HStack>
      </div>
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// Gap Sizes
// ---------------------------------------------------------------------------

export const GapSizes: Story = {
  name: 'Gap Sizes',
  render: () => {
    const gaps: StackGap[] = ['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    return (
      <Stack gap="xl">
        {gaps.map((g) => (
          <div key={g}>
            <Text size="xs" color="secondary" style={{ marginBottom: 4 }}>
              gap="{g}"
            </Text>
            <HStack gap={g}>
              <DemoBox width={60}>A</DemoBox>
              <DemoBox width={60}>B</DemoBox>
              <DemoBox width={60}>C</DemoBox>
            </HStack>
          </div>
        ))}
      </Stack>
    );
  },
};

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

export const Alignment: Story = {
  name: 'Alignment',
  render: () => (
    <Stack gap="xl">
      {stackAligns.map((a) => (
        <div key={a}>
          <Text size="xs" color="secondary" style={{ marginBottom: 4 }}>
            align="{a}"
          </Text>
          <HStack gap="sm" align={a} style={{ height: 80 }}>
            <DemoBox height={30}>A</DemoBox>
            <DemoBox height={50}>B</DemoBox>
            <DemoBox height={40}>C</DemoBox>
          </HStack>
        </div>
      ))}
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// Justify
// ---------------------------------------------------------------------------

export const Justify: Story = {
  name: 'Justify',
  render: () => (
    <Stack gap="xl">
      {stackJustifys.map((j) => (
        <div key={j}>
          <Text size="xs" color="secondary" style={{ marginBottom: 4 }}>
            justify="{j}"
          </Text>
          <HStack gap="sm" justify={j}>
            <DemoBox width={60}>A</DemoBox>
            <DemoBox width={60}>B</DemoBox>
            <DemoBox width={60}>C</DemoBox>
          </HStack>
        </div>
      ))}
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// Wrap
// ---------------------------------------------------------------------------

export const Wrap: Story = {
  name: 'Wrap',
  render: () => (
    <div style={{ maxWidth: 300 }}>
      <Text size="xs" color="secondary" style={{ marginBottom: 4 }}>
        wrap=true (container: 300px)
      </Text>
      <HStack gap="sm" wrap>
        {Array.from({ length: 8 }, (_, i) => (
          <DemoBox key={i} width={80}>
            {i + 1}
          </DemoBox>
        ))}
      </HStack>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export const WithDivider: Story = {
  name: 'With Divider',
  render: () => (
    <Stack gap="xl">
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>Vertical with dividers</Text>
        <Stack gap="md" divider>
          <DemoBox>Section 1</DemoBox>
          <DemoBox>Section 2</DemoBox>
          <DemoBox>Section 3</DemoBox>
        </Stack>
      </div>
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>Horizontal with dividers</Text>
        <HStack gap="md" divider align="center">
          <DemoBox>Left</DemoBox>
          <DemoBox>Center</DemoBox>
          <DemoBox>Right</DemoBox>
        </HStack>
      </div>
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// Reverse
// ---------------------------------------------------------------------------

export const Reverse: Story = {
  name: 'Reverse',
  render: () => (
    <Stack gap="xl">
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>Normal order</Text>
        <HStack gap="sm">
          <DemoBox>1</DemoBox>
          <DemoBox>2</DemoBox>
          <DemoBox>3</DemoBox>
        </HStack>
      </div>
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>Reversed</Text>
        <HStack gap="sm" reverse>
          <DemoBox>1</DemoBox>
          <DemoBox>2</DemoBox>
          <DemoBox>3</DemoBox>
        </HStack>
      </div>
    </Stack>
  ),
};

// ---------------------------------------------------------------------------
// HStack & VStack aliases
// ---------------------------------------------------------------------------

export const Aliases: Story = {
  name: 'HStack & VStack',
  render: () => (
    <VStack gap="xl">
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>VStack (vertical)</Text>
        <VStack gap="sm">
          <DemoBox>A</DemoBox>
          <DemoBox>B</DemoBox>
          <DemoBox>C</DemoBox>
        </VStack>
      </div>
      <div>
        <Text size="sm" weight="semibold" style={{ marginBottom: 8 }}>HStack (horizontal)</Text>
        <HStack gap="sm">
          <DemoBox>A</DemoBox>
          <DemoBox>B</DemoBox>
          <DemoBox>C</DemoBox>
        </HStack>
      </div>
    </VStack>
  ),
};
