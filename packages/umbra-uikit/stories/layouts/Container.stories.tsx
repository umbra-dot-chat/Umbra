import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Container } from '@wisp-ui/react';
import { containerSizes, containerSizeMap } from '@wisp-ui/react';
import type { ContainerSize } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { useThemeColors } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Container> = {
  title: 'React/Layouts/Container',
  component: Container,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...containerSizes] },
    center: { control: 'boolean' },
    px: {
      control: 'select',
      options: ['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

// ---------------------------------------------------------------------------
// Helper — visual box for demos
// ---------------------------------------------------------------------------

function DemoBox({ children }: { children?: React.ReactNode }) {
  const themeColors = useThemeColors();
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: themeColors.background.surface,
        fontSize: 14,
        fontWeight: 500,
        color: themeColors.text.primary,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Default — lg max-width
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  args: {
    size: 'lg',
    center: true,
    px: 'lg',
  },
  render: (args) => {
    const themeColors = useThemeColors();
    return (
      <div style={{ width: '100%' }}>
        <Container
          {...args}
          style={{ border: `1px dashed ${themeColors.border.subtle}` }}
        >
          <DemoBox>
            Container with size="lg" (max-width: 1024px), centered with 16px
            horizontal padding.
          </DemoBox>
        </Container>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 2. All Sizes — show width constraints with visible borders
// ---------------------------------------------------------------------------

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => {
    const themeColors = useThemeColors();
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
        }}
      >
        {containerSizes.map((size) => {
          const maxW = containerSizeMap[size];
          const label =
            typeof maxW === 'number' ? `${size} (${maxW}px)` : `${size} (${maxW})`;
          return (
            <Container
              key={size}
              size={size}
              style={{ border: `1px dashed ${themeColors.border.subtle}` }}
            >
              <DemoBox>
                <Text size="sm" weight="semibold">
                  {label}
                </Text>
              </DemoBox>
            </Container>
          );
        })}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. With Content — text paragraphs constrained
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => {
    const themeColors = useThemeColors();
    return (
      <Container
        size="md"
        style={{ border: `1px dashed ${themeColors.border.subtle}` }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Text size="lg" weight="bold">
            Constrained Content
          </Text>
          <Text size="base" color="secondary">
            This container uses size="md" which constrains the content to a
            max-width of 768px. The text inside wraps naturally within the
            container boundaries, making it ideal for readable article-style
            layouts where line lengths should be controlled for comfortable
            reading.
          </Text>
          <Text size="base" color="secondary">
            Horizontal padding is applied via the px prop, which maps to theme
            spacing tokens. The default padding of "lg" provides 16px on each
            side, giving content room to breathe away from container edges on
            smaller viewports.
          </Text>
        </div>
      </Container>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Off-Center — center=false
// ---------------------------------------------------------------------------

export const OffCenter: Story = {
  name: 'Off-Center',
  render: () => {
    const themeColors = useThemeColors();
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
        }}
      >
        <div>
          <Text size="xs" color="secondary" style={{ marginBottom: 4 }}>
            center=true (default)
          </Text>
          <Container
            size="sm"
            style={{ border: `1px dashed ${themeColors.border.subtle}` }}
          >
            <DemoBox>Centered container (sm, 640px)</DemoBox>
          </Container>
        </div>
        <div>
          <Text size="xs" color="secondary" style={{ marginBottom: 4 }}>
            center=false
          </Text>
          <Container
            size="sm"
            center={false}
            style={{ border: `1px dashed ${themeColors.border.subtle}` }}
          >
            <DemoBox>Left-aligned container (sm, 640px)</DemoBox>
          </Container>
        </div>
      </div>
    );
  },
};
