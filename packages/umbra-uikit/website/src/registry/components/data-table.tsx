import React from 'react';
import { DataTable, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const sampleData = [
  { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { name: 'Bob', email: 'bob@example.com', role: 'Editor' },
  { name: 'Carol', email: 'carol@example.com', role: 'Viewer' },
  { name: 'Dave', email: 'dave@example.com', role: 'Editor' },
];

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', sortable: true },
];

export const dataTableEntry: ComponentEntry = {
  slug: 'data-table',
  name: 'DataTable',
  category: 'components',
  subcategory: 'Data Display',
  description:
    'Data-driven table with sorting, row selection, striped/hoverable rows, card variant, sticky header, and skeleton loading.',
  variantCount: 2,
  keywords: ['data', 'table', 'sort', 'select', 'grid', 'rows'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 220, overflow: 'hidden', pointerEvents: 'none' }}>
      <DataTable data={sampleData.slice(0, 2)} columns={columns.slice(0, 2)} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Sortable',
      render: (
        <div style={{ width: '100%', maxWidth: 500 }}>
          <DataTable data={sampleData} columns={columns} sortable hoverable />
        </div>
      ),
      code: `import { DataTable } from '@wisp-ui/react';

<DataTable
  data={data}
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', sortable: true },
  ]}
  sortable
  hoverable
/>`,
      rnCode: `import { DataTable } from '@wisp-ui/react-native';

<DataTable
  data={data}
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', sortable: true },
  ]}
  sortable
  hoverable
/>`,
    },
    {
      title: 'Selectable',
      render: (
        <div style={{ width: '100%', maxWidth: 500 }}>
          <DataTable data={sampleData} columns={columns} selectable striped />
        </div>
      ),
      code: `<DataTable data={data} columns={columns} selectable striped />`,
      rnCode: `import { DataTable } from '@wisp-ui/react-native';

<DataTable data={data} columns={columns} selectable striped />`,
    },
  ],

  props: [
    { name: 'data', type: 'T[]', required: true, description: 'Row data array.' },
    { name: 'columns', type: 'DataTableColumn<T>[]', required: true, description: 'Column definitions.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Visual size.' },
    { name: 'variant', type: "'default' | 'card'", default: "'default'", description: 'Visual variant.' },
    { name: 'selectable', type: 'boolean', default: 'false', description: 'Show checkbox column.' },
    { name: 'sortable', type: 'boolean', default: 'false', description: 'Enable column sorting.' },
    { name: 'striped', type: 'boolean', default: 'false', description: 'Alternating row backgrounds.' },
    { name: 'hoverable', type: 'boolean', default: 'true', description: 'Highlight on hover.' },
    { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Sticky header.' },
    { name: 'emptyMessage', type: 'string', default: "'No data'", description: 'Empty state message.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
