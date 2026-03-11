import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Grid, GridItem } from './Grid';
import { Text } from '../../primitives/text';
import { Box } from '../box';
import { useThemeColors } from '../../providers';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Grid> = {
  title: 'Layouts/Grid',
  component: Grid,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Grid>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Cell({
  children,
  label,
  ...props
}: React.ComponentProps<typeof Box> & { label?: string }) {
  const themeColors = useThemeColors();

  return (
    <Box
      p="md"
      radius="md"
      {...props}
      style={{
        backgroundColor: themeColors.background.surface,
        border: `1px solid ${themeColors.border.subtle}`,
        ...props.style,
      }}
    >
      {label && (
        <Text size="xs" color="tertiary" weight="medium" as="div" style={{ marginBottom: 2 }}>
          {label}
        </Text>
      )}
      {children}
    </Box>
  );
}

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
// 1. Basic Columns
// ---------------------------------------------------------------------------

export const BasicColumns: Story = {
  name: 'Basic Columns',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>2 Columns</SectionLabel>
      <Grid columns={2} gap="md">
        <Cell><Text size="sm">Cell 1</Text></Cell>
        <Cell><Text size="sm">Cell 2</Text></Cell>
        <Cell><Text size="sm">Cell 3</Text></Cell>
        <Cell><Text size="sm">Cell 4</Text></Cell>
      </Grid>

      <SectionLabel>3 Columns</SectionLabel>
      <Grid columns={3} gap="md">
        {Array.from({ length: 6 }, (_, i) => (
          <Cell key={i}><Text size="sm">Cell {i + 1}</Text></Cell>
        ))}
      </Grid>

      <SectionLabel>4 Columns</SectionLabel>
      <Grid columns={4} gap="sm">
        {Array.from({ length: 8 }, (_, i) => (
          <Cell key={i}><Text size="sm">Cell {i + 1}</Text></Cell>
        ))}
      </Grid>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Gap Variants
// ---------------------------------------------------------------------------

export const GapVariants: Story = {
  name: 'Gap Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((gapKey) => (
        <div key={gapKey}>
          <SectionLabel>gap=&quot;{gapKey}&quot;</SectionLabel>
          <Grid columns={4} gap={gapKey}>
            {Array.from({ length: 4 }, (_, i) => (
              <Cell key={i}><Text size="sm">Cell</Text></Cell>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Column & Row Spans
// ---------------------------------------------------------------------------

export const Spanning: Story = {
  name: 'Column & Row Spans',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>colSpan</SectionLabel>
      <Grid columns={4} gap="md">
        <GridItem colSpan={2}>
          <Cell label="colSpan={2}"><Text size="sm">Wide cell</Text></Cell>
        </GridItem>
        <Cell><Text size="sm">Cell</Text></Cell>
        <Cell><Text size="sm">Cell</Text></Cell>
        <GridItem colSpan={3}>
          <Cell label="colSpan={3}"><Text size="sm">Extra wide</Text></Cell>
        </GridItem>
        <Cell><Text size="sm">Cell</Text></Cell>
      </Grid>

      <SectionLabel>rowSpan</SectionLabel>
      <Grid columns={3} gap="md" autoRows="minmax(60px, auto)">
        <GridItem rowSpan={2}>
          <Cell label="rowSpan={2}" style={{ height: '100%' }}>
            <Text size="sm">Tall cell</Text>
          </Cell>
        </GridItem>
        <Cell><Text size="sm">Cell</Text></Cell>
        <Cell><Text size="sm">Cell</Text></Cell>
        <Cell><Text size="sm">Cell</Text></Cell>
        <Cell><Text size="sm">Cell</Text></Cell>
      </Grid>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Named Areas
// ---------------------------------------------------------------------------

export const NamedAreas: Story = {
  name: 'Named Template Areas',
  render: () => (
    <Grid
      areas={'"header header header" "sidebar main main" "sidebar main main" "footer footer footer"'}
      columns="180px 1fr 1fr"
      rows="auto 1fr 1fr auto"
      gap="md"
      style={{ minHeight: 320 }}
    >
      <GridItem area="header">
        <Cell label="header"><Text size="sm" weight="semibold">Header</Text></Cell>
      </GridItem>
      <GridItem area="sidebar">
        <Cell label="sidebar" style={{ height: '100%' }}>
          <Text size="sm">Sidebar</Text>
        </Cell>
      </GridItem>
      <GridItem area="main">
        <Cell label="main" style={{ height: '100%' }}>
          <Text size="sm">Main Content</Text>
        </Cell>
      </GridItem>
      <GridItem area="footer">
        <Cell label="footer"><Text size="sm">Footer</Text></Cell>
      </GridItem>
    </Grid>
  ),
};

// ---------------------------------------------------------------------------
// 5. Alignment
// ---------------------------------------------------------------------------

export const Alignment: Story = {
  name: 'Alignment',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>alignItems=&quot;center&quot;</SectionLabel>
      <Grid columns={3} gap="md" alignItems="center" style={{ minHeight: 120 }}>
        <Cell style={{ height: 40 }}><Text size="sm">Short</Text></Cell>
        <Cell style={{ height: 80 }}><Text size="sm">Tall</Text></Cell>
        <Cell style={{ height: 60 }}><Text size="sm">Medium</Text></Cell>
      </Grid>

      <SectionLabel>justifyItems=&quot;center&quot;</SectionLabel>
      <Grid columns={3} gap="md" justifyItems="center">
        <Cell style={{ width: 80 }}><Text size="sm">80px</Text></Cell>
        <Cell style={{ width: 120 }}><Text size="sm">120px</Text></Cell>
        <Cell style={{ width: 60 }}><Text size="sm">60px</Text></Cell>
      </Grid>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Custom Column Widths
// ---------------------------------------------------------------------------

export const CustomColumnWidths: Story = {
  name: 'Custom Column Widths',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>columns=&quot;200px 1fr 1fr&quot;</SectionLabel>
      <Grid columns="200px 1fr 1fr" gap="md">
        <Cell label="200px"><Text size="sm">Fixed</Text></Cell>
        <Cell label="1fr"><Text size="sm">Flexible</Text></Cell>
        <Cell label="1fr"><Text size="sm">Flexible</Text></Cell>
      </Grid>

      <SectionLabel>columns=&quot;1fr 2fr 1fr&quot;</SectionLabel>
      <Grid columns="1fr 2fr 1fr" gap="md">
        <Cell label="1fr"><Text size="sm">Small</Text></Cell>
        <Cell label="2fr"><Text size="sm">Double</Text></Cell>
        <Cell label="1fr"><Text size="sm">Small</Text></Cell>
      </Grid>

      <SectionLabel>Responsive: minmax auto-fill</SectionLabel>
      <Grid columns="repeat(auto-fill, minmax(150px, 1fr))" gap="md">
        {Array.from({ length: 7 }, (_, i) => (
          <Cell key={i}><Text size="sm">Item {i + 1}</Text></Cell>
        ))}
      </Grid>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Asymmetric Gaps
// ---------------------------------------------------------------------------

export const AsymmetricGaps: Story = {
  name: 'Asymmetric Gaps',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionLabel>columnGap=&quot;xl&quot; rowGap=&quot;xs&quot;</SectionLabel>
      <Grid columns={3} columnGap="xl" rowGap="xs">
        {Array.from({ length: 6 }, (_, i) => (
          <Cell key={i}><Text size="sm">Cell {i + 1}</Text></Cell>
        ))}
      </Grid>
    </div>
  ),
};
