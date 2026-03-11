import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Collapse } from '@wisp-ui/react';
import { collapseDurations } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Box } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';
import { VStack } from '@wisp-ui/react';
import { useThemeColors } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Collapse> = {
  title: 'React/Layouts/Collapse',
  component: Collapse,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Collapse>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ContentBlock({ text }: { text: string }) {
  const themeColors = useThemeColors();

  return (
    <Box
      p="lg"
      radius="md"
      style={{
        backgroundColor: themeColors.background.surface,
        border: `1px solid ${themeColors.border.subtle}`,
      }}
    >
      <Text size="sm">{text}</Text>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// 1. Basic Toggle
// ---------------------------------------------------------------------------

export const BasicToggle: Story = {
  name: 'Basic Toggle',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <VStack gap="md" style={{ maxWidth: 480 }}>
        <Button size="sm" onClick={() => setOpen(!open)}>
          {open ? 'Collapse' : 'Expand'}
        </Button>
        <Collapse open={open}>
          <ContentBlock text="This content smoothly expands and collapses with a measured height transition. The Collapse primitive handles all the animation details automatically." />
        </Collapse>
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. Duration Variants
// ---------------------------------------------------------------------------

export const DurationVariants: Story = {
  name: 'Duration Variants',
  render: () => {
    const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

    const toggle = (key: string) =>
      setOpenStates((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
      <VStack gap="lg" style={{ maxWidth: 480 }}>
        {collapseDurations.map((dur) => (
          <VStack key={dur} gap="sm">
            <Button size="sm" onClick={() => toggle(dur)}>
              {dur} ({openStates[dur] ? 'Close' : 'Open'})
            </Button>
            <Collapse open={!!openStates[dur]} duration={dur}>
              <ContentBlock text={`Duration: "${dur}". This panel transitions at the ${dur} speed preset.`} />
            </Collapse>
          </VStack>
        ))}
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. Nested Collapse
// ---------------------------------------------------------------------------

export const NestedCollapse: Story = {
  name: 'Nested Collapse',
  render: () => {
    const [outerOpen, setOuterOpen] = useState(false);
    const [innerOpen, setInnerOpen] = useState(false);

    return (
      <VStack gap="md" style={{ maxWidth: 480 }}>
        <Button size="sm" onClick={() => setOuterOpen(!outerOpen)}>
          {outerOpen ? 'Close Outer' : 'Open Outer'}
        </Button>
        <Collapse open={outerOpen}>
          <VStack gap="md">
            <ContentBlock text="Outer collapsible content. You can nest Collapse primitives inside each other." />
            <Button size="sm" variant="outline" onClick={() => setInnerOpen(!innerOpen)}>
              {innerOpen ? 'Close Inner' : 'Open Inner'}
            </Button>
            <Collapse open={innerOpen}>
              <ContentBlock text="Inner nested collapsible content. Each level animates independently." />
            </Collapse>
          </VStack>
        </Collapse>
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Unmount on Close
// ---------------------------------------------------------------------------

export const UnmountOnClose: Story = {
  name: 'Unmount on Close',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <VStack gap="md" style={{ maxWidth: 480 }}>
        <Button size="sm" onClick={() => setOpen(!open)}>
          {open ? 'Close (unmounts)' : 'Open'}
        </Button>
        <Collapse open={open} unmountOnClose>
          <ContentBlock text="This content is fully unmounted from the DOM when collapsed. Useful for heavy content that shouldn't stay in memory." />
        </Collapse>
        <Text size="xs" color="tertiary">
          Content is {open ? 'mounted' : 'unmounted'} from the DOM
        </Text>
      </VStack>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. Multiple Sections (FAQ pattern)
// ---------------------------------------------------------------------------

export const FAQPattern: Story = {
  name: 'FAQ Pattern',
  render: () => {
    const items = [
      { q: 'What is the Collapse primitive?', a: 'Collapse is an animated expand/collapse container that measures content height and smoothly transitions between open and closed states.' },
      { q: 'How does it differ from Accordion?', a: 'Collapse is the low-level primitive that handles the animation. Accordion is a higher-level component that manages open/close state for multiple panels.' },
      { q: 'Can I nest Collapse components?', a: 'Yes! Each Collapse independently measures and animates its content, so nesting works naturally.' },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
      <VStack gap="xs" style={{ maxWidth: 480 }}>
        {items.map((item, i) => (
          <VStack key={i} gap="none">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              {item.q}
            </Button>
            <Collapse open={openIndex === i} duration="fast">
              <Box p="md" pl="lg">
                <Text size="sm" color="secondary">{item.a}</Text>
              </Box>
            </Collapse>
          </VStack>
        ))}
      </VStack>
    );
  },
};
