import React from 'react';
import { Grid, GridItem, Text, Box } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import { DemoBox } from '../../shared/DemoBox';

export const gridEntry: ComponentEntry = {
  slug: 'grid',
  name: 'Grid',
  category: 'layouts',
  subcategory: 'Spacing & Alignment',
  description:
    'CSS Grid layout with configurable columns, rows, gap, areas, flow, and alignment. Includes GridItem for span/area control.',
  variantCount: 2,
  keywords: ['grid', 'layout', 'columns', 'rows', 'responsive'],

  cardPreview: (
    <Grid columns={3} gap="xs" style={{ width: '100%', maxWidth: 200 }}>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <DemoBox key={n} p="sm" radius="sm" style={{ textAlign: 'center' }}>
          <Text size="xs">{n}</Text>
        </DemoBox>
      ))}
    </Grid>
  ),

  examples: [
    {
      title: 'Basic Grid',
      render: (
        <Grid columns={3} gap="md" style={{ width: '100%', maxWidth: 400 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <DemoBox key={n} p="md" radius="sm" style={{ textAlign: 'center' }}>
              <Text>{n}</Text>
            </DemoBox>
          ))}
        </Grid>
      ),
      code: `import { Grid } from '@wisp-ui/react';

<Grid columns={3} gap="md">
  <Box p="md">1</Box>
  <Box p="md">2</Box>
  <Box p="md">3</Box>
  <Box p="md">4</Box>
  <Box p="md">5</Box>
  <Box p="md">6</Box>
</Grid>`,
      rnCode: `import { Grid } from '@wisp-ui/react-native';

<Grid columns={3} gap={12}>
  <Box p="md">1</Box>
  <Box p="md">2</Box>
  <Box p="md">3</Box>
  <Box p="md">4</Box>
  <Box p="md">5</Box>
  <Box p="md">6</Box>
</Grid>`,
    },
    {
      title: 'Column Span',
      render: (
        <Grid columns={4} gap="md" style={{ width: '100%', maxWidth: 500 }}>
          <GridItem colSpan={2}>
            <DemoBox p="md" radius="sm" style={{ textAlign: 'center' }}>
              <Text>Span 2</Text>
            </DemoBox>
          </GridItem>
          <DemoBox p="md" radius="sm" style={{ textAlign: 'center' }}>
            <Text>1</Text>
          </DemoBox>
          <DemoBox p="md" radius="sm" style={{ textAlign: 'center' }}>
            <Text>1</Text>
          </DemoBox>
          <GridItem colSpan={4}>
            <DemoBox p="md" radius="sm" style={{ textAlign: 'center' }}>
              <Text>Full width (span 4)</Text>
            </DemoBox>
          </GridItem>
        </Grid>
      ),
      code: `<Grid columns={4} gap="md">
  <GridItem colSpan={2}><Box>Span 2</Box></GridItem>
  <Box>1</Box>
  <Box>1</Box>
  <GridItem colSpan={4}><Box>Full width</Box></GridItem>
</Grid>`,
      rnCode: `<Grid columns={4} gap={12}>
  <GridItem colSpan={2}><Box>Span 2</Box></GridItem>
  <Box>1</Box>
  <Box>1</Box>
  <GridItem colSpan={4}><Box>Full width</Box></GridItem>
</Grid>`,
    },
  ],

  props: [
    { name: 'columns', type: 'number | string', default: '1', description: 'Number of columns or CSS value.' },
    { name: 'rows', type: 'number | string', description: 'Number of rows or CSS value.' },
    { name: 'gap', type: 'ThemeSpacingKey', default: "'md'", description: 'Gap between cells.' },
    { name: 'columnGap', type: 'ThemeSpacingKey', description: 'Override column gap.' },
    { name: 'rowGap', type: 'ThemeSpacingKey', description: 'Override row gap.' },
    { name: 'areas', type: 'string', description: 'CSS grid-template-areas.' },
    { name: 'flow', type: "'row' | 'column' | 'dense'", default: "'row'", description: 'Grid auto flow.' },
    { name: 'alignItems', type: "'start' | 'center' | 'end' | 'stretch'", default: "'stretch'", description: 'Vertical item alignment.' },
    { name: 'justifyItems', type: "'start' | 'center' | 'end' | 'stretch'", default: "'stretch'", description: 'Horizontal item alignment.' },
    { name: 'inline', type: 'boolean', default: 'false', description: 'Use inline-grid display.' },
  ],
};
