import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Grid, GridItem, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof GridItem> = {
  title: 'React Native/Layouts/GridItem',
  component: GridItem,
  tags: ['autodocs'],
  argTypes: {
    colSpan: { control: 'number' },
    alignSelf: { control: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch'] },
  },
};

export default meta;
type Story = StoryObj<typeof GridItem>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

const Cell = ({ label, color = '#3b82f6', height = 48 }: { label: string; color?: string; height?: number }) => (
  <div
    style={{
      backgroundColor: color,
      borderRadius: 6,
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div style={sectionLabel}>GridItem inside a 3-column Grid</div>
      <Grid columns={3} gap={12}>
        <GridItem>
          <Cell label="1" color="#3b82f6" />
        </GridItem>
        <GridItem>
          <Cell label="2" color="#8b5cf6" />
        </GridItem>
        <GridItem>
          <Cell label="3" color="#ec4899" />
        </GridItem>
        <GridItem>
          <Cell label="4" color="#f59e0b" />
        </GridItem>
        <GridItem>
          <Cell label="5" color="#10b981" />
        </GridItem>
        <GridItem>
          <Cell label="6" color="#6366f1" />
        </GridItem>
      </Grid>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. ColSpan
// ---------------------------------------------------------------------------

export const ColSpan: Story = {
  name: 'Col Span',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>colSpan=2 in a 3-column grid</div>
        <Grid columns={3} gap={12}>
          <GridItem colSpan={2}>
            <Cell label="Span 2" color="#3b82f6" />
          </GridItem>
          <GridItem>
            <Cell label="1" color="#8b5cf6" />
          </GridItem>
          <GridItem>
            <Cell label="1" color="#ec4899" />
          </GridItem>
          <GridItem colSpan={2}>
            <Cell label="Span 2" color="#f59e0b" />
          </GridItem>
        </Grid>
      </div>

      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>colSpan=3 (full width) in a 3-column grid</div>
        <Grid columns={3} gap={12}>
          <GridItem colSpan={3}>
            <Cell label="Full Width (Span 3)" color="#1e293b" />
          </GridItem>
          <GridItem>
            <Cell label="1" color="#3b82f6" />
          </GridItem>
          <GridItem>
            <Cell label="1" color="#8b5cf6" />
          </GridItem>
          <GridItem>
            <Cell label="1" color="#ec4899" />
          </GridItem>
        </Grid>
      </div>

      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Mixed spans in a 4-column grid</div>
        <Grid columns={4} gap={12}>
          <GridItem colSpan={1}>
            <Cell label="1" color="#3b82f6" />
          </GridItem>
          <GridItem colSpan={3}>
            <Cell label="Span 3" color="#8b5cf6" />
          </GridItem>
          <GridItem colSpan={2}>
            <Cell label="Span 2" color="#ec4899" />
          </GridItem>
          <GridItem colSpan={2}>
            <Cell label="Span 2" color="#f59e0b" />
          </GridItem>
        </Grid>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. RowSpan
// ---------------------------------------------------------------------------

export const RowSpan: Story = {
  name: 'Row Span',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>alignSelf variants</div>
        <Grid columns={3} gap={12}>
          <GridItem alignSelf="flex-start">
            <Cell label="start" color="#3b82f6" height={32} />
          </GridItem>
          <GridItem alignSelf="center">
            <Cell label="center" color="#8b5cf6" height={32} />
          </GridItem>
          <GridItem alignSelf="flex-end">
            <Cell label="end" color="#ec4899" height={32} />
          </GridItem>
        </Grid>
      </div>

      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Tall item alongside shorter items</div>
        <Grid columns={3} gap={12}>
          <GridItem alignSelf="stretch">
            <Cell label="Stretch" color="#3b82f6" height={100} />
          </GridItem>
          <GridItem alignSelf="flex-start">
            <Cell label="Start" color="#8b5cf6" height={40} />
          </GridItem>
          <GridItem alignSelf="center">
            <Cell label="Center" color="#ec4899" height={40} />
          </GridItem>
        </Grid>
      </div>

      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Dashboard-style layout with colSpan + alignSelf</div>
        <Grid columns={4} gap={12}>
          <GridItem colSpan={4}>
            <Cell label="Header (Span 4)" color="#1e293b" height={40} />
          </GridItem>
          <GridItem colSpan={1} alignSelf="stretch">
            <Cell label="Sidebar" color="#3b82f6" height={120} />
          </GridItem>
          <GridItem colSpan={3}>
            <Cell label="Main Content (Span 3)" color="#8b5cf6" height={120} />
          </GridItem>
          <GridItem colSpan={2}>
            <Cell label="Widget A" color="#ec4899" height={56} />
          </GridItem>
          <GridItem colSpan={2}>
            <Cell label="Widget B" color="#f59e0b" height={56} />
          </GridItem>
        </Grid>
      </div>
    </div>
  ),
};
