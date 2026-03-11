import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Sticky } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Box } from '@wisp-ui/react';
import { VStack } from '@wisp-ui/react';
import { Separator } from '@wisp-ui/react';
import { useThemeColors } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Sticky> = {
  title: 'React/Layouts/Sticky',
  component: Sticky,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sticky>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Placeholder({ height = 200, label }: { height?: number; label: string }) {
  const themeColors = useThemeColors();
  return (
    <Box
      p="md"
      radius="md"
      style={{
        height,
        backgroundColor: themeColors.background.surface,
        border: `1px solid ${themeColors.border.subtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text size="sm" color="secondary">{label}</Text>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// 1. Sticky Top Header
// ---------------------------------------------------------------------------

export const StickyTopHeader: Story = {
  name: 'Sticky Top Header',
  render: () => {
    const themeColors = useThemeColors();

    return (
      <Box style={{ maxHeight: 400, overflow: 'auto' }} radius="lg">
        <VStack gap="md" style={{ padding: 16 }}>
          <Sticky edge="top">
            <Box
              p="md"
              px="lg"
              style={{
                backgroundColor: themeColors.background.raised,
                borderBottom: `1px solid ${themeColors.border.subtle}`,
              }}
            >
              <Text size="sm" weight="semibold">Sticky Header (scroll down)</Text>
            </Box>
          </Sticky>

          {Array.from({ length: 10 }, (_, i) => (
            <Placeholder key={i} height={100} label={`Section ${i + 1}`} />
          ))}
        </VStack>
      </Box>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. Sticky Bottom
// ---------------------------------------------------------------------------

export const StickyBottom: Story = {
  name: 'Sticky Bottom',
  render: () => {
    const themeColors = useThemeColors();

    return (
      <Box style={{ maxHeight: 400, overflow: 'auto', position: 'relative' }} radius="lg">
        <VStack gap="md" style={{ padding: 16 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Placeholder key={i} height={80} label={`Item ${i + 1}`} />
          ))}

          <Sticky edge="bottom">
            <Box
              p="md"
              px="lg"
              style={{
                backgroundColor: themeColors.background.raised,
                borderTop: `1px solid ${themeColors.border.subtle}`,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <Text size="sm" weight="medium">Sticky Footer Actions</Text>
            </Box>
          </Sticky>
        </VStack>
      </Box>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Sticky with Offset
// ---------------------------------------------------------------------------

export const StickyWithOffset: Story = {
  name: 'Sticky with Offset',
  render: () => {
    const themeColors = useThemeColors();

    return (
      <Box style={{ maxHeight: 400, overflow: 'auto' }} radius="lg">
        <VStack gap="md" style={{ padding: 16 }}>
          <Sticky edge="top" offset={0}>
            <Box
              p="sm"
              px="lg"
              style={{
                backgroundColor: themeColors.background.raised,
                borderBottom: `1px solid ${themeColors.border.subtle}`,
              }}
            >
              <Text size="xs" weight="semibold">Top Bar (offset: 0)</Text>
            </Box>
          </Sticky>

          <Sticky edge="top" offset={40}>
            <Box
              p="sm"
              px="lg"
              style={{
                backgroundColor: themeColors.background.surface,
                borderBottom: `1px solid ${themeColors.border.subtle}`,
              }}
            >
              <Text size="xs" weight="medium">Sub Bar (offset: 40px)</Text>
            </Box>
          </Sticky>

          {Array.from({ length: 10 }, (_, i) => (
            <Placeholder key={i} height={80} label={`Content ${i + 1}`} />
          ))}
        </VStack>
      </Box>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Sticky Section Headers
// ---------------------------------------------------------------------------

export const StickySectionHeaders: Story = {
  name: 'Sticky Section Headers',
  render: () => {
    const themeColors = useThemeColors();
    const sections = ['Alpha', 'Beta', 'Gamma', 'Delta'];

    return (
      <Box style={{ maxHeight: 400, overflow: 'auto' }} radius="lg">
        <VStack gap="none">
          {sections.map((section) => (
            <React.Fragment key={section}>
              <Sticky edge="top" zIndex="dropdown">
                <Box
                  py="xs"
                  px="lg"
                  style={{
                    backgroundColor: themeColors.background.raised,
                    borderBottom: `1px solid ${themeColors.border.subtle}`,
                  }}
                >
                  <Text size="xs" weight="semibold" color="secondary">
                    {section}
                  </Text>
                </Box>
              </Sticky>
              {Array.from({ length: 5 }, (_, i) => (
                <Box key={i} py="md" px="lg">
                  <Separator spacing="none" />
                  <Box py="sm">
                    <Text size="sm">{section} item {i + 1}</Text>
                  </Box>
                </Box>
              ))}
            </React.Fragment>
          ))}
        </VStack>
      </Box>
    );
  },
};
