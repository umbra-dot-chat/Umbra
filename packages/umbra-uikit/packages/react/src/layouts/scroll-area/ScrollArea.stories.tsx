import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from './ScrollArea';
import { scrollAreaDirections, scrollbarWidths } from '@coexist/wisp-core/types/ScrollArea.types';
import { Text } from '../../primitives/text';
import { useThemeColors } from '../../providers';

const meta: Meta<typeof ScrollArea> = {
  title: 'Layouts/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: [...scrollAreaDirections] },
    scrollbarWidth: { control: 'select', options: [...scrollbarWidths] },
    hideScrollbar: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function DemoItem({ index }: { index: number }) {
  const themeColors = useThemeColors();
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${themeColors.border.subtle}`,
        color: themeColors.text.primary,
        fontSize: 14,
      }}
    >
      <Text size="sm" weight="medium">Item {index + 1}</Text>
      <Text size="xs" color="secondary" style={{ marginTop: 2 }}>
        Description for item {index + 1}
      </Text>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default (Vertical)
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const themeColors = useThemeColors();
      return (
        <div
          style={{
            border: `1px solid ${themeColors.border.subtle}`,
            borderRadius: 12,
            overflow: 'hidden',
            width: 320,
          }}
        >
          <ScrollArea maxHeight={300}>
            {Array.from({ length: 20 }, (_, i) => (
              <DemoItem key={i} index={i} />
            ))}
          </ScrollArea>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => {
    const Demo = () => {
      const themeColors = useThemeColors();
      return (
        <div
          style={{
            border: `1px solid ${themeColors.border.subtle}`,
            borderRadius: 12,
            overflow: 'hidden',
            width: 400,
          }}
        >
          <ScrollArea direction="horizontal" maxWidth={400}>
            <div style={{ display: 'flex', gap: 12, padding: 16, width: 'max-content' }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 120,
                    height: 80,
                    borderRadius: 8,
                    backgroundColor: themeColors.background.surface,
                    border: `1px solid ${themeColors.border.subtle}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: themeColors.text.onRaised,
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Card {i + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Hidden Scrollbar
// ---------------------------------------------------------------------------

export const HiddenScrollbar: Story = {
  name: 'Hidden Scrollbar',
  render: () => {
    const Demo = () => {
      const themeColors = useThemeColors();
      return (
        <div
          style={{
            border: `1px solid ${themeColors.border.subtle}`,
            borderRadius: 12,
            overflow: 'hidden',
            width: 320,
          }}
        >
          <ScrollArea maxHeight={200} hideScrollbar>
            {Array.from({ length: 15 }, (_, i) => (
              <DemoItem key={i} index={i} />
            ))}
          </ScrollArea>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Scrollbar Widths
// ---------------------------------------------------------------------------

export const ScrollbarWidths: Story = {
  name: 'Scrollbar Widths',
  render: () => {
    const Demo = () => {
      const themeColors = useThemeColors();
      return (
        <div style={{ display: 'flex', gap: 24 }}>
          {scrollbarWidths.filter((w) => w !== 'none').map((w) => (
            <div key={w}>
              <Text size="xs" color="secondary" style={{ marginBottom: 8 }}>
                scrollbarWidth="{w}"
              </Text>
              <div
                style={{
                  border: `1px solid ${themeColors.border.subtle}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  width: 240,
                }}
              >
                <ScrollArea maxHeight={200} scrollbarWidth={w}>
                  {Array.from({ length: 15 }, (_, i) => (
                    <DemoItem key={i} index={i} />
                  ))}
                </ScrollArea>
              </div>
            </div>
          ))}
        </div>
      );
    };
    return <Demo />;
  },
};
