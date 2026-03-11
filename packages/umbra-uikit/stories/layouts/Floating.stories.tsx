import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Floating } from '@wisp-ui/react';
import { floatingPlacements, floatingAligns } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Box } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';
import { VStack, HStack } from '@wisp-ui/react';
import { useThemeColors } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Floating> = {
  title: 'React/Layouts/Floating',
  component: Floating,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Floating>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FloatingPanel({ children }: { children: React.ReactNode }) {
  const themeColors = useThemeColors();
  return (
    <Box
      p="md"
      radius="md"
      style={{
        backgroundColor: themeColors.background.raised,
        border: `1px solid ${themeColors.border.subtle}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: 160,
      }}
    >
      {children}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// 1. Placement Variants
// ---------------------------------------------------------------------------

export const PlacementVariants: Story = {
  name: 'Placement Variants',
  render: () => {
    const [active, setActive] = useState<string | null>(null);

    return (
      <Box p="4xl" display="flex" style={{ justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <VStack gap="md" align="center">
          <Floating
            open={active === 'top'}
            placement="top"
            content={
              <FloatingPanel>
                <Text size="sm">Placed on top</Text>
              </FloatingPanel>
            }
          >
            <Button size="sm" onClick={() => setActive(active === 'top' ? null : 'top')}>
              Top
            </Button>
          </Floating>

          <HStack gap="xl">
            <Floating
              open={active === 'left'}
              placement="left"
              content={
                <FloatingPanel>
                  <Text size="sm">Placed on left</Text>
                </FloatingPanel>
              }
            >
              <Button size="sm" onClick={() => setActive(active === 'left' ? null : 'left')}>
                Left
              </Button>
            </Floating>

            <Floating
              open={active === 'right'}
              placement="right"
              content={
                <FloatingPanel>
                  <Text size="sm">Placed on right</Text>
                </FloatingPanel>
              }
            >
              <Button size="sm" onClick={() => setActive(active === 'right' ? null : 'right')}>
                Right
              </Button>
            </Floating>
          </HStack>

          <Floating
            open={active === 'bottom'}
            placement="bottom"
            content={
              <FloatingPanel>
                <Text size="sm">Placed on bottom</Text>
              </FloatingPanel>
            }
          >
            <Button size="sm" onClick={() => setActive(active === 'bottom' ? null : 'bottom')}>
              Bottom
            </Button>
          </Floating>
        </VStack>
      </Box>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. Alignment Variants
// ---------------------------------------------------------------------------

export const AlignmentVariants: Story = {
  name: 'Alignment Variants',
  render: () => {
    const [active, setActive] = useState<string | null>(null);

    return (
      <VStack gap="lg" align="center" style={{ minHeight: 200, paddingTop: 40 }}>
        <Text size="xs" color="tertiary" weight="semibold" style={{ textTransform: 'uppercase' }}>
          Bottom placement with different alignments
        </Text>
        <HStack gap="xl">
          {floatingAligns.map((a) => (
            <Floating
              key={a}
              open={active === a}
              placement="bottom"
              align={a}
              content={
                <FloatingPanel>
                  <Text size="sm">align=&quot;{a}&quot;</Text>
                </FloatingPanel>
              }
            >
              <Button size="sm" onClick={() => setActive(active === a ? null : a)}>
                {a}
              </Button>
            </Floating>
          ))}
        </HStack>
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Dropdown Menu Pattern
// ---------------------------------------------------------------------------

export const DropdownPattern: Story = {
  name: 'Dropdown Menu Pattern',
  render: () => {
    const [open, setOpen] = useState(false);
    const themeColors = useThemeColors();

    return (
      <VStack gap="md" style={{ minHeight: 200 }}>
        <Floating
          open={open}
          placement="bottom"
          align="start"
          offset={4}
          content={
            <Box
              radius="md"
              py="xs"
              style={{
                backgroundColor: themeColors.background.raised,
                border: `1px solid ${themeColors.border.subtle}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: 180,
              }}
            >
              <VStack gap="none">
                {['Profile', 'Settings', 'Billing', 'Sign out'].map((item) => (
                  <Box
                    key={item}
                    px="md"
                    py="sm"
                    style={{ cursor: 'pointer' }}
                  >
                    <Text size="sm">{item}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          }
        >
          <Button size="sm" onClick={() => setOpen(!open)}>
            Account Menu
          </Button>
        </Floating>
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Offset Variants
// ---------------------------------------------------------------------------

export const OffsetVariants: Story = {
  name: 'Offset Variants',
  render: () => {
    const [active, setActive] = useState<number | null>(null);
    const offsets = [0, 4, 8, 16, 32];

    return (
      <VStack gap="md" align="center" style={{ minHeight: 200, paddingTop: 40 }}>
        <HStack gap="md">
          {offsets.map((o) => (
            <Floating
              key={o}
              open={active === o}
              placement="bottom"
              offset={o}
              content={
                <FloatingPanel>
                  <Text size="sm">offset={o}</Text>
                </FloatingPanel>
              }
            >
              <Button size="sm" onClick={() => setActive(active === o ? null : o)}>
                {o}px
              </Button>
            </Floating>
          ))}
        </HStack>
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. Auto-flip Demo
// ---------------------------------------------------------------------------

export const AutoFlip: Story = {
  name: 'Auto-flip (viewport collision)',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <VStack gap="md" style={{ minHeight: 120 }}>
        <Text size="xs" color="tertiary">
          This button is near the top. The floating panel requests &quot;top&quot; placement but will flip to
          &quot;bottom&quot; because there is not enough space above.
        </Text>
        <Floating
          open={open}
          placement="top"
          strategy="flip"
          content={
            <FloatingPanel>
              <Text size="sm">Requested top, may flip to bottom!</Text>
            </FloatingPanel>
          }
        >
          <Button size="sm" onClick={() => setOpen(!open)}>
            Near Top Edge
          </Button>
        </Floating>
      </VStack>
    );
  },
};
