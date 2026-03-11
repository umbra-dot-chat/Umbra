import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Text, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const tableEntry: ComponentEntry = {
  slug: 'table',
  name: 'Table',
  category: 'components',
  subcategory: 'Data Display',
  description:
    'Compound table with header, body, footer, striped rows, hoverable rows, sticky header, and size variants.',
  variantCount: 3,
  keywords: ['table', 'data', 'rows', 'columns', 'grid'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 220, overflow: 'hidden' }}>
      <Table size="sm">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob</TableCell>
            <TableCell>User</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 500 }}>
          <Table hoverable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead align="right">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Alice Johnson</TableCell>
                <TableCell>alice@example.com</TableCell>
                <TableCell align="right">Admin</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bob Smith</TableCell>
                <TableCell>bob@example.com</TableCell>
                <TableCell align="right">Editor</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Carol White</TableCell>
                <TableCell>carol@example.com</TableCell>
                <TableCell align="right">Viewer</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ),
      code: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@wisp-ui/react';\n\n<Table hoverable>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead align="right">Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Alice</TableCell>
      <TableCell>alice@example.com</TableCell>
      <TableCell align="right">Admin</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
      rnCode: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@wisp-ui/react-native';

<Table hoverable>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead align="right">Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Alice</TableCell>
      <TableCell>alice@example.com</TableCell>
      <TableCell align="right">Admin</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Striped',
      render: (
        <div style={{ width: '100%', maxWidth: 500 }}>
          <Table variant="striped" size="sm">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead align="right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: 1, name: 'Widget', price: '$9.99' },
                { id: 2, name: 'Gadget', price: '$19.99' },
                { id: 3, name: 'Doohickey', price: '$4.99' },
              ].map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell align="right">{p.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ),
      code: `<Table variant="striped" size="sm">…</Table>`,
      rnCode: `import { Table } from '@wisp-ui/react-native';

<Table variant="striped" size="sm">…</Table>`,
    },
    {
      title: 'Bordered',
      render: (
        <div style={{ width: '100%', maxWidth: 500 }}>
          <Table bordered hoverable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Alice Johnson</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">$250.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bob Smith</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell align="right">$150.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Carol White</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">$350.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ),
      code: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@wisp-ui/react';

<Table bordered hoverable>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead align="right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Alice</TableCell>
      <TableCell>Active</TableCell>
      <TableCell align="right">$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
      rnCode: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@wisp-ui/react-native';

<Table bordered hoverable>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead align="right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Alice</TableCell>
      <TableCell>Active</TableCell>
      <TableCell align="right">$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    },
  ],

  props: [
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell padding size.' },
    { name: 'variant', type: "'default' | 'striped'", default: "'default'", description: 'Row style variant.' },
    { name: 'hoverable', type: 'boolean', default: 'false', description: 'Highlight rows on hover.' },
    { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Sticky header row.' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'Card-like container with rounded border.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Table sections.' },
  ],
};
