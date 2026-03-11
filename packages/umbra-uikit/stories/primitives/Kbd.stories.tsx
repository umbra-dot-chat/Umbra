import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Kbd } from '@wisp-ui/react';
import { kbdSizes } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Kbd> = {
  title: 'React/Primitives/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...kbdSizes] },
  },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default (playground)
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'K',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. Sizes — sm, md, lg
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {kbdSizes.map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Kbd size={size}>K</Kbd>
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Key Combination — single Kbd with a combo string
// ---------------------------------------------------------------------------

export const KeyCombination: Story = {
  name: 'Key Combination',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Key combination in a single Kbd</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Kbd>⌘K</Kbd>
        <Kbd>Ctrl+S</Kbd>
        <Kbd>Alt+F4</Kbd>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Modifier Keys — each key as a separate Kbd
// ---------------------------------------------------------------------------

export const ModifierKeys: Story = {
  name: 'Modifier Keys',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Each key as a separate Kbd</SectionLabel>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>P</Kbd>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Kbd>Ctrl</Kbd>
        <Kbd>Alt</Kbd>
        <Kbd>Del</Kbd>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Kbd>⌘</Kbd>
        <Kbd>C</Kbd>
        <Text size="sm" color="secondary" style={{ margin: '0 8px' }}>/</Text>
        <Kbd>⌘</Kbd>
        <Kbd>V</Kbd>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Text — inline keyboard shortcut within a sentence
// ---------------------------------------------------------------------------

export const WithText: Story = {
  name: 'With Text',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Inline with text</SectionLabel>
      <Text size="sm" color="secondary">
        Press <Kbd size="sm">⌘K</Kbd> to open the command palette
      </Text>
      <Text size="sm" color="secondary">
        Save your work with <Kbd size="sm">⌘</Kbd> <Kbd size="sm">S</Kbd>
      </Text>
      <Text size="md" color="primary">
        Use <Kbd size="md">Esc</Kbd> to close the dialog
      </Text>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Platform Keys — showing platform-specific keys
// ---------------------------------------------------------------------------

export const PlatformKeys: Story = {
  name: 'Platform Keys',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>macOS shortcuts</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Kbd>⌘</Kbd><Kbd>C</Kbd>
          <Text size="xs" color="tertiary" style={{ marginLeft: 4 }}>Copy</Text>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Kbd>⌘</Kbd><Kbd>V</Kbd>
          <Text size="xs" color="tertiary" style={{ marginLeft: 4 }}>Paste</Text>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd>
          <Text size="xs" color="tertiary" style={{ marginLeft: 4 }}>Command Palette</Text>
        </div>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Windows / Linux shortcuts</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Kbd>Ctrl</Kbd><Kbd>C</Kbd>
          <Text size="xs" color="tertiary" style={{ marginLeft: 4 }}>Copy</Text>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Kbd>Ctrl</Kbd><Kbd>V</Kbd>
          <Text size="xs" color="tertiary" style={{ marginLeft: 4 }}>Paste</Text>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Kbd>Ctrl</Kbd><Kbd>Shift</Kbd><Kbd>P</Kbd>
          <Text size="xs" color="tertiary" style={{ marginLeft: 4 }}>Command Palette</Text>
        </div>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Common keys across sizes</SectionLabel>
      {kbdSizes.map((size) => (
        <div key={size} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Text size="xs" color="tertiary" style={{ width: 24, textAlign: 'right', flexShrink: 0 }}>{size}</Text>
          <Kbd size={size}>⌘</Kbd>
          <Kbd size={size}>⇧</Kbd>
          <Kbd size={size}>⌥</Kbd>
          <Kbd size={size}>⌃</Kbd>
          <Kbd size={size}>↵</Kbd>
          <Kbd size={size}>⌫</Kbd>
          <Kbd size={size}>Esc</Kbd>
          <Kbd size={size}>Tab</Kbd>
        </div>
      ))}
    </div>
  ),
};
