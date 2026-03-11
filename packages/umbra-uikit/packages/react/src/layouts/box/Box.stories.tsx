import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';
import { spacingKeys, radiiKeys } from '@coexist/wisp-core/types/Box.types';
import { Text } from '../../primitives/text';
import { useThemeColors } from '../../providers';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Box> = {
  title: 'Layouts/Box',
  component: Box,
  tags: ['autodocs'],
  argTypes: {
    p:  { control: 'select', options: [...spacingKeys] },
    px: { control: 'select', options: [...spacingKeys] },
    py: { control: 'select', options: [...spacingKeys] },
    pt: { control: 'select', options: [...spacingKeys] },
    pr: { control: 'select', options: [...spacingKeys] },
    pb: { control: 'select', options: [...spacingKeys] },
    pl: { control: 'select', options: [...spacingKeys] },
    radius:   { control: 'select', options: [...radiiKeys] },
    display:  { control: 'select', options: ['block', 'flex', 'grid', 'inline', 'inline-flex', 'none'] },
    position: { control: 'select', options: ['relative', 'absolute', 'fixed', 'sticky'] },
  },
};

export default meta;
type Story = StoryObj<typeof Box>;

// ---------------------------------------------------------------------------
// Helper: themed demo box with visible background
// ---------------------------------------------------------------------------

function DemoBox({
  children,
  label,
  ...props
}: React.ComponentProps<typeof Box> & { label?: string }) {
  const themeColors = useThemeColors();

  return (
    <Box
      {...props}
      style={{
        backgroundColor: themeColors.background.surface,
        color: themeColors.text.onRaised,
        ...props.style,
      }}
    >
      {label && (
        <Text size="xs" color="secondary" weight="medium" as="div" style={{ marginBottom: 4 }}>
          {label}
        </Text>
      )}
      {children}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      size="xs"
      color="tertiary"
      weight="semibold"
      style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// 1. Padding Variants — all spacing keys
// ---------------------------------------------------------------------------

export const PaddingVariants: Story = {
  name: 'Padding Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Uniform padding (p)</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {(['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((key) => (
          <DemoBox key={key} p={key} radius="md" label={key}>
            <Text size="sm">Content</Text>
          </DemoBox>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Horizontal padding (px)</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((key) => (
          <DemoBox key={key} px={key} py="sm" radius="sm">
            <Text size="sm">px=&quot;{key}&quot;</Text>
          </DemoBox>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Vertical padding (py)</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((key) => (
          <DemoBox key={key} py={key} px="md" radius="sm">
            <Text size="sm">py=&quot;{key}&quot;</Text>
          </DemoBox>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Padding Override Order
// ---------------------------------------------------------------------------

export const PaddingOverrideOrder: Story = {
  name: 'Padding Override Order',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Specific overrides axis overrides shorthand</SectionLabel>

      <DemoBox p="sm" radius="md" label='p="sm" (8 px all sides)'>
        <Text size="sm">Uniform small padding</Text>
      </DemoBox>

      <DemoBox p="sm" px="xl" radius="md" label='p="sm" px="xl" (24 px left/right, 8 px top/bottom)'>
        <Text size="sm">px overrides p on the horizontal axis</Text>
      </DemoBox>

      <DemoBox p="sm" px="xl" pl="3xl" radius="md" label='p="sm" px="xl" pl="3xl" (48 px left, 24 px right, 8 px top/bottom)'>
        <Text size="sm">pl overrides px which overrides p</Text>
      </DemoBox>

      <DemoBox py="lg" pt="none" radius="md" label='py="lg" pt="none" (0 top, 16 px bottom)'>
        <Text size="sm">pt overrides py on the top edge</Text>
      </DemoBox>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Display
// ---------------------------------------------------------------------------

export const Display: Story = {
  name: 'Display',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>display=&quot;block&quot; (default)</SectionLabel>
      <DemoBox p="md" radius="md" display="block">
        <Text size="sm">Block-level container</Text>
      </DemoBox>

      <SectionLabel>display=&quot;flex&quot;</SectionLabel>
      <DemoBox p="md" radius="md" display="flex" style={{ gap: 12 }}>
        <DemoBox p="sm" radius="sm" style={{ flex: 1 }}>
          <Text size="sm">Item 1</Text>
        </DemoBox>
        <DemoBox p="sm" radius="sm" style={{ flex: 1 }}>
          <Text size="sm">Item 2</Text>
        </DemoBox>
        <DemoBox p="sm" radius="sm" style={{ flex: 1 }}>
          <Text size="sm">Item 3</Text>
        </DemoBox>
      </DemoBox>

      <SectionLabel>display=&quot;inline-flex&quot;</SectionLabel>
      <div>
        <DemoBox p="sm" px="md" radius="full" display="inline-flex" style={{ gap: 8 }}>
          <Text size="sm" weight="medium">Tag A</Text>
        </DemoBox>
        <span style={{ display: 'inline-block', width: 8 }} />
        <DemoBox p="sm" px="md" radius="full" display="inline-flex" style={{ gap: 8 }}>
          <Text size="sm" weight="medium">Tag B</Text>
        </DemoBox>
      </div>

      <SectionLabel>display=&quot;grid&quot;</SectionLabel>
      <DemoBox p="md" radius="md" display="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <DemoBox p="sm" radius="sm"><Text size="sm">Cell 1</Text></DemoBox>
        <DemoBox p="sm" radius="sm"><Text size="sm">Cell 2</Text></DemoBox>
        <DemoBox p="sm" radius="sm"><Text size="sm">Cell 3</Text></DemoBox>
        <DemoBox p="sm" radius="sm"><Text size="sm">Cell 4</Text></DemoBox>
        <DemoBox p="sm" radius="sm"><Text size="sm">Cell 5</Text></DemoBox>
        <DemoBox p="sm" radius="sm"><Text size="sm">Cell 6</Text></DemoBox>
      </DemoBox>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Border Radius
// ---------------------------------------------------------------------------

export const BorderRadius: Story = {
  name: 'Border Radius',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
      {(['none', 'sm', 'md', 'lg', 'xl', 'full'] as const).map((key) => (
        <DemoBox
          key={key}
          p="lg"
          radius={key}
          width={key === 'full' ? 80 : undefined}
          height={key === 'full' ? 80 : undefined}
          display={key === 'full' ? 'flex' : undefined}
          style={
            key === 'full'
              ? { alignItems: 'center', justifyContent: 'center' }
              : undefined
          }
        >
          <Text size="xs" weight="medium">{key}</Text>
        </DemoBox>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Sizing
// ---------------------------------------------------------------------------

export const Sizing: Story = {
  name: 'Sizing',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Fixed width / height</SectionLabel>
      <DemoBox p="md" radius="md" width={200} height={100}>
        <Text size="sm">200 x 100 px</Text>
      </DemoBox>

      <SectionLabel>Percentage width</SectionLabel>
      <DemoBox p="md" radius="md" width="50%">
        <Text size="sm">50% width</Text>
      </DemoBox>

      <SectionLabel>maxWidth constraint</SectionLabel>
      <DemoBox p="md" radius="md" maxWidth={320}>
        <Text size="sm">
          This box is constrained to a maximum width of 320 px regardless of its container.
        </Text>
      </DemoBox>

      <SectionLabel>minHeight</SectionLabel>
      <DemoBox p="md" radius="md" minHeight={120}>
        <Text size="sm">Min height 120 px</Text>
      </DemoBox>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Polymorphic "as" prop
// ---------------------------------------------------------------------------

export const PolymorphicAs: Story = {
  name: 'Polymorphic As',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>as=&quot;div&quot; (default)</SectionLabel>
      <DemoBox p="md" radius="md">
        <Text size="sm">Rendered as a div</Text>
      </DemoBox>

      <SectionLabel>as=&quot;section&quot;</SectionLabel>
      <DemoBox as="section" p="md" radius="md">
        <Text size="sm">Rendered as a section element</Text>
      </DemoBox>

      <SectionLabel>as=&quot;article&quot;</SectionLabel>
      <DemoBox as="article" p="lg" radius="lg">
        <Text size="md" weight="semibold" as="h3" style={{ marginBottom: 4 }}>Article Title</Text>
        <Text size="sm" color="secondary">Rendered as an article element for semantic markup.</Text>
      </DemoBox>

      <SectionLabel>as=&quot;aside&quot;</SectionLabel>
      <DemoBox as="aside" p="md" radius="md">
        <Text size="sm" color="secondary">Sidebar content rendered as an aside element.</Text>
      </DemoBox>

      <SectionLabel>as=&quot;nav&quot;</SectionLabel>
      <DemoBox as="nav" p="sm" px="md" radius="md" display="flex" style={{ gap: 16 }}>
        <Text size="sm" weight="medium">Home</Text>
        <Text size="sm" weight="medium">About</Text>
        <Text size="sm" weight="medium">Contact</Text>
      </DemoBox>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Composition — real-world usage patterns
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const themeColors = useThemeColors();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
        <SectionLabel>Card layout</SectionLabel>
        <Box
          p="xl"
          radius="lg"
          style={{
            backgroundColor: themeColors.background.surface,
            border: `1px solid ${themeColors.border.subtle}`,
          }}
        >
          <Text size="lg" weight="semibold" as="h3" style={{ marginBottom: 4 }}>
            Project Overview
          </Text>
          <Text size="sm" color="secondary" as="p">
            A card-like container using Box with padding and radius from the theme scale.
          </Text>
        </Box>

        <SectionLabel>Nested boxes</SectionLabel>
        <Box
          p="lg"
          radius="lg"
          style={{
            backgroundColor: themeColors.background.surface,
            border: `1px solid ${themeColors.border.subtle}`,
          }}
        >
          <Text size="sm" weight="medium" style={{ marginBottom: 8 }} as="div">
            Outer Box (p=&quot;lg&quot;)
          </Text>
          <Box
            p="md"
            radius="md"
            style={{
              backgroundColor: themeColors.background.raised,
              border: `1px solid ${themeColors.border.subtle}`,
            }}
          >
            <Text size="sm" color="secondary">
              Inner Box (p=&quot;md&quot;) nested inside
            </Text>
          </Box>
        </Box>

        <SectionLabel>Toolbar-like row</SectionLabel>
        <Box
          px="lg"
          py="sm"
          radius="md"
          display="flex"
          style={{
            backgroundColor: themeColors.background.surface,
            border: `1px solid ${themeColors.border.subtle}`,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text size="sm" weight="semibold">Dashboard</Text>
          <Text size="xs" color="secondary">Last updated 3 min ago</Text>
        </Box>

        <SectionLabel>Pill badge row</SectionLabel>
        <Box display="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
          {['React', 'TypeScript', 'Storybook', 'Wisp'].map((tag) => (
            <Box
              key={tag}
              px="md"
              py="xs"
              radius="full"
              display="inline-flex"
              style={{
                backgroundColor: themeColors.accent.highlight,
              }}
            >
              <Text size="xs" weight="medium">{tag}</Text>
            </Box>
          ))}
        </Box>

        <SectionLabel>Absolute positioned badge</SectionLabel>
        <Box
          position="relative"
          p="xl"
          radius="lg"
          style={{
            backgroundColor: themeColors.background.surface,
            border: `1px solid ${themeColors.border.subtle}`,
          }}
        >
          <Text size="sm">Container with a floating badge</Text>
          <Box
            position="absolute"
            px="sm"
            py="2xs"
            radius="full"
            style={{
              top: -8,
              right: -8,
              backgroundColor: themeColors.status.danger,
            }}
          >
            <Text size="xs" weight="semibold" color="white">3</Text>
          </Box>
        </Box>
      </div>
    );
  },
};
