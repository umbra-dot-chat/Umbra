import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Grid, GridItem } from '@wisp-ui/react-native';

const meta: Meta<typeof Grid> = {
  title: 'React Native/Layouts/Grid',
  component: Grid,
  tags: ['autodocs'],
  argTypes: {
    columns: { control: 'number' },
    gap: { control: 'number' },
    columnGap: { control: 'number' },
    rowGap: { control: 'number' },
    alignItems: { control: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch'] },
  },
};

export default meta;
type Story = StoryObj<typeof Grid>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const Cell = ({ children, height }: { children: React.ReactNode; height?: number }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      height: height ?? 48,
      borderRadius: 8,
      backgroundColor: '#F0F2F5',
      border: '1px solid #E2E6ED',
      fontSize: 13,
      color: '#3B4963',
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
    columns: 3,
    gap: 12,
    children: (
      <>
        {Array.from({ length: 6 }, (_, i) => (
          <GridItem key={i}>
            <Cell>{i + 1}</Cell>
          </GridItem>
        ))}
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 500 }}>
        <Story />
      </div>
    ),
  ],
};

// ---------------------------------------------------------------------------
// 2. Columns
// ---------------------------------------------------------------------------

export const Columns: Story = {
  name: 'Columns',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          2 Columns
        </div>
        <Grid columns={2} gap={12}>
          {Array.from({ length: 4 }, (_, i) => (
            <GridItem key={i}>
              <Cell>{i + 1}</Cell>
            </GridItem>
          ))}
        </Grid>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          3 Columns
        </div>
        <Grid columns={3} gap={12}>
          {Array.from({ length: 6 }, (_, i) => (
            <GridItem key={i}>
              <Cell>{i + 1}</Cell>
            </GridItem>
          ))}
        </Grid>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          4 Columns
        </div>
        <Grid columns={4} gap={12}>
          {Array.from({ length: 8 }, (_, i) => (
            <GridItem key={i}>
              <Cell>{i + 1}</Cell>
            </GridItem>
          ))}
        </Grid>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. WithSpan
// ---------------------------------------------------------------------------

export const WithSpan: Story = {
  name: 'With Span',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          colSpan 2 in a 4-column grid
        </div>
        <Grid columns={4} gap={12}>
          <GridItem colSpan={2}>
            <Cell>Span 2</Cell>
          </GridItem>
          <GridItem>
            <Cell>1</Cell>
          </GridItem>
          <GridItem>
            <Cell>1</Cell>
          </GridItem>
          <GridItem>
            <Cell>1</Cell>
          </GridItem>
          <GridItem colSpan={3}>
            <Cell>Span 3</Cell>
          </GridItem>
        </Grid>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Full-width row in a 3-column grid
        </div>
        <Grid columns={3} gap={12}>
          <GridItem>
            <Cell>1</Cell>
          </GridItem>
          <GridItem>
            <Cell>2</Cell>
          </GridItem>
          <GridItem>
            <Cell>3</Cell>
          </GridItem>
          <GridItem colSpan={3}>
            <Cell>Full Width (Span 3)</Cell>
          </GridItem>
        </Grid>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. ResponsiveGrid
// ---------------------------------------------------------------------------

export const ResponsiveGrid: Story = {
  name: 'Responsive Grid',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Custom gaps (columnGap: 24, rowGap: 8)
        </div>
        <Grid columns={3} columnGap={24} rowGap={8}>
          {Array.from({ length: 9 }, (_, i) => (
            <GridItem key={i}>
              <Cell>{i + 1}</Cell>
            </GridItem>
          ))}
        </Grid>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Alignment: center
        </div>
        <Grid columns={3} gap={12} alignItems="center">
          <GridItem>
            <Cell height={48}>Short</Cell>
          </GridItem>
          <GridItem>
            <Cell height={96}>Tall</Cell>
          </GridItem>
          <GridItem>
            <Cell height={64}>Medium</Cell>
          </GridItem>
        </Grid>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Dashboard-style layout (mixed spans)
        </div>
        <Grid columns={4} gap={12}>
          <GridItem colSpan={2}>
            <Cell height={80}>Main Panel</Cell>
          </GridItem>
          <GridItem>
            <Cell height={80}>Sidebar A</Cell>
          </GridItem>
          <GridItem>
            <Cell height={80}>Sidebar B</Cell>
          </GridItem>
          <GridItem>
            <Cell height={60}>Card 1</Cell>
          </GridItem>
          <GridItem>
            <Cell height={60}>Card 2</Cell>
          </GridItem>
          <GridItem>
            <Cell height={60}>Card 3</Cell>
          </GridItem>
          <GridItem>
            <Cell height={60}>Card 4</Cell>
          </GridItem>
          <GridItem colSpan={4}>
            <Cell height={48}>Footer</Cell>
          </GridItem>
        </Grid>
      </div>
    </div>
  ),
};
