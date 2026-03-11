import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '@wisp-ui/react';
import { dataTableSizes, dataTableVariants } from '@wisp-ui/react';
import type { DataTableColumn, SortState } from '@wisp-ui/react';

const meta: Meta<typeof DataTable> = {
  title: 'React/Components/Data Display/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...dataTableSizes] },
    variant: { control: 'select', options: [...dataTableVariants] },
    striped: { control: 'boolean' },
    hoverable: { control: 'boolean' },
    selectable: { control: 'boolean' },
    sortable: { control: 'boolean' },
    stickyHeader: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

const sampleUsers: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Designer', status: 'Active' },
  { id: 3, name: 'Carol Lee', email: 'carol@example.com', role: 'Product Manager', status: 'On Leave' },
  { id: 4, name: 'Dan Brown', email: 'dan@example.com', role: 'Engineer', status: 'Active' },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'QA Lead', status: 'Inactive' },
];

const baseColumns: DataTableColumn<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <DataTable<User>
      data={sampleUsers}
      columns={baseColumns}
    />
  ),
};

export const Sortable: Story = {
  name: 'Sortable',
  render: () => {
    const [sort, setSort] = useState<SortState>(null);

    const sortedData = [...sampleUsers].sort((a, b) => {
      if (!sort) return 0;
      const aVal = (a as any)[sort.key];
      const bVal = (b as any)[sort.key];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return (
      <DataTable<User>
        data={sortedData}
        columns={baseColumns}
        sortable
        sort={sort}
        onSortChange={setSort}
      />
    );
  },
};

export const Selectable: Story = {
  name: 'Selectable',
  render: () => {
    const [selected, setSelected] = useState<Set<number>>(new Set());
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <DataTable<User>
          data={sampleUsers}
          columns={baseColumns}
          selectable
          selectedRows={selected}
          onSelectionChange={setSelected}
        />
        <span style={{ fontSize: 13, color: '#8B8FA3' }}>
          Selected: {selected.size === 0 ? 'none' : Array.from(selected).map((i) => sampleUsers[i].name).join(', ')}
        </span>
      </div>
    );
  },
};

export const Striped: Story = {
  name: 'Striped',
  render: () => (
    <DataTable<User>
      data={sampleUsers}
      columns={baseColumns}
      striped
    />
  ),
};

export const CustomRendering: Story = {
  name: 'Custom Rendering',
  render: () => {
    const columnsWithStatus: DataTableColumn<User>[] = [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role' },
      {
        key: 'status',
        header: 'Status',
        render: (value: string) => {
          const colorMap: Record<string, { bg: string; text: string }> = {
            Active: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399' },
            'On Leave': { bg: 'rgba(251, 191, 36, 0.15)', text: '#FBBF24' },
            Inactive: { bg: 'rgba(248, 113, 113, 0.15)', text: '#F87171' },
          };
          const colors = colorMap[value] ?? { bg: 'transparent', text: 'inherit' };
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: colors.bg,
                color: colors.text,
              }}
            >
              {value}
            </span>
          );
        },
      },
    ];

    return (
      <DataTable<User>
        data={sampleUsers}
        columns={columnsWithStatus}
        hoverable
      />
    );
  },
};

export const Empty: Story = {
  name: 'Empty',
  render: () => (
    <DataTable<User>
      data={[]}
      columns={baseColumns}
      emptyMessage="No users found"
    />
  ),
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#8B8FA3', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            {size}
          </span>
          <DataTable<User>
            data={sampleUsers.slice(0, 3)}
            columns={baseColumns}
            size={size}
            hoverable
          />
        </div>
      ))}
    </div>
  ),
};

export const CardVariant: Story = {
  name: 'Card Variant',
  render: () => (
    <DataTable<User>
      data={sampleUsers}
      columns={baseColumns}
      variant="card"
      hoverable
    />
  ),
};

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <DataTable<User>
      data={[]}
      columns={baseColumns}
      skeleton
      skeletonRows={5}
    />
  ),
};
