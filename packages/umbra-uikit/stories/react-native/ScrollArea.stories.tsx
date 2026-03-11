import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof ScrollArea> = {
  title: 'React Native/Layouts/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['vertical', 'horizontal', 'both'] },
    maxHeight: { control: 'number' },
    maxWidth: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleItems = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);

const ItemBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#F0F2F5',
      border: '1px solid #E2E6ED',
      fontSize: 13,
      color: '#3B4963',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    direction: 'vertical',
    maxHeight: 240,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
        {sampleItems.map((item) => (
          <ItemBox key={item}>{item}</ItemBox>
        ))}
      </div>
    ),
  },
};

// ---------------------------------------------------------------------------
// 2. Horizontal
// ---------------------------------------------------------------------------

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Horizontal Scroll
      </div>
      <ScrollArea direction="horizontal" maxWidth={500}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, padding: 4 }}>
          {sampleItems.map((item) => (
            <ItemBox key={item}>{item}</ItemBox>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Vertical
// ---------------------------------------------------------------------------

export const Vertical: Story = {
  name: 'Vertical',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Vertical Scroll (maxHeight: 200)
      </div>
      <ScrollArea direction="vertical" maxHeight={200}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
          {sampleItems.map((item) => (
            <ItemBox key={item}>{item}</ItemBox>
          ))}
        </div>
      </ScrollArea>

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16 }}>
        Vertical Scroll (maxHeight: 320)
      </div>
      <ScrollArea direction="vertical" maxHeight={320}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
          {sampleItems.map((item) => (
            <ItemBox key={item}>{item}</ItemBox>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};
