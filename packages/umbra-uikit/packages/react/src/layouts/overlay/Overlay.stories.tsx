import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Overlay } from './Overlay';
import { overlayBackdrops } from '@coexist/wisp-core/types/Overlay.types';
import { Text } from '../../primitives/text';
import { Box } from '../box';
import { Button } from '../../primitives/button';
import { VStack, HStack } from '../stack';
import { useThemeColors } from '../../providers';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Overlay> = {
  title: 'Layouts/Overlay',
  component: Overlay,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Overlay>;

// ---------------------------------------------------------------------------
// 1. Basic Overlay
// ---------------------------------------------------------------------------

export const BasicOverlay: Story = {
  name: 'Basic Overlay',
  render: () => {
    const [open, setOpen] = useState(false);
    const themeColors = useThemeColors();

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Overlay</Button>
        <Overlay open={open} onBackdropClick={() => setOpen(false)}>
          <Box
            p="xl"
            radius="lg"
            style={{
              backgroundColor: themeColors.background.raised,
              border: `1px solid ${themeColors.border.subtle}`,
              minWidth: 320,
            }}
          >
            <VStack gap="md">
              <Text size="lg" weight="semibold">Overlay Content</Text>
              <Text size="sm" color="secondary">
                Click the backdrop or press Escape to close.
              </Text>
              <HStack gap="sm" justify="end">
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={() => setOpen(false)}>Confirm</Button>
              </HStack>
            </VStack>
          </Box>
        </Overlay>
      </>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. Backdrop Variants
// ---------------------------------------------------------------------------

export const BackdropVariants: Story = {
  name: 'Backdrop Variants',
  render: () => {
    const [active, setActive] = useState<string | null>(null);
    const themeColors = useThemeColors();

    return (
      <VStack gap="md">
        <HStack gap="sm">
          {overlayBackdrops.map((bd) => (
            <Button key={bd} size="sm" onClick={() => setActive(bd)}>
              {bd}
            </Button>
          ))}
        </HStack>
        <Text size="xs" color="tertiary">Click a button to preview each backdrop style</Text>
        {overlayBackdrops.map((bd) => (
          <Overlay
            key={bd}
            open={active === bd}
            backdrop={bd}
            onBackdropClick={() => setActive(null)}
          >
            <Box
              p="xl"
              radius="lg"
              style={{
                backgroundColor: themeColors.background.raised,
                border: `1px solid ${themeColors.border.subtle}`,
                minWidth: 280,
              }}
            >
              <VStack gap="sm">
                <Text size="md" weight="semibold">backdrop=&quot;{bd}&quot;</Text>
                <Text size="sm" color="secondary">Click backdrop to close</Text>
              </VStack>
            </Box>
          </Overlay>
        ))}
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Non-centered Overlay
// ---------------------------------------------------------------------------

export const NonCentered: Story = {
  name: 'Non-centered',
  render: () => {
    const [open, setOpen] = useState(false);
    const themeColors = useThemeColors();

    return (
      <>
        <Button size="sm" onClick={() => setOpen(true)}>
          Open (non-centered)
        </Button>
        <Overlay
          open={open}
          center={false}
          onBackdropClick={() => setOpen(false)}
        >
          <Box
            p="lg"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 320,
              backgroundColor: themeColors.background.raised,
              borderRadius: 12,
              border: `1px solid ${themeColors.border.subtle}`,
            }}
          >
            <VStack gap="sm">
              <Text size="md" weight="semibold">Notification Panel</Text>
              <Text size="sm" color="secondary">
                With center=false, you can position content absolutely within the overlay.
              </Text>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Dismiss
              </Button>
            </VStack>
          </Box>
        </Overlay>
      </>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Loading Overlay Pattern
// ---------------------------------------------------------------------------

export const LoadingPattern: Story = {
  name: 'Loading Overlay Pattern',
  render: () => {
    const [loading, setLoading] = useState(false);

    const startLoading = () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 2000);
    };

    return (
      <VStack gap="md">
        <Button size="sm" onClick={startLoading} disabled={loading}>
          {loading ? 'Loading...' : 'Start Loading (2s)'}
        </Button>
        <Overlay open={loading} backdrop="blur" closeOnEscape={false}>
          <VStack gap="md" align="center">
            <Text size="lg" weight="semibold" color="white">Loading...</Text>
            <Text size="sm" color="white" style={{ opacity: 0.7 }}>
              Please wait while we process your request.
            </Text>
          </VStack>
        </Overlay>
      </VStack>
    );
  },
};
