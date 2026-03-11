import React, { useState, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '@wisp-ui/react-native';
import type { DataTableColumn, SortState } from '@wisp-ui/react-native';

const meta: Meta = {
  title: 'React Native/Components/Data Display/DataTable',
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    striped: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

const sampleData: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { id: 3, name: 'Carol Lee', email: 'carol@example.com', role: 'Viewer', status: 'Inactive' },
  { id: 4, name: 'David Kim', email: 'david@example.com', role: 'Editor', status: 'Active' },
  { id: 5, name: 'Eva Martinez', email: 'eva@example.com', role: 'Admin', status: 'Active' },
];

const defaultColumns: DataTableColumn<User>[] = [
  { key: 'id', header: '#', width: 60, align: 'center' },
  { key: 'name', header: 'Name', width: 160 },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', width: 100 },
  { key: 'status', header: 'Status', width: 100, align: 'center' },
];

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionLabel}>Basic data table</div>
      <DataTable<User>
        data={sampleData}
        columns={defaultColumns}
        keyExtractor={(item) => String(item.id)}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Sortable
// ---------------------------------------------------------------------------

function SortableExample() {
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' });

  const sortableColumns: DataTableColumn<User>[] = [
    { key: 'id', header: '#', width: 60, align: 'center', sortable: true },
    { key: 'name', header: 'Name', width: 160, sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role', width: 100, sortable: true },
    { key: 'status', header: 'Status', width: 100, align: 'center' },
  ];

  const sorted = useMemo(() => {
    const copy = [...sampleData];
    copy.sort((a, b) => {
      const aVal = String((a as any)[sort.key]);
      const bVal = String((b as any)[sort.key]);
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sort.direction === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [sort]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionLabel}>Click column headers to sort</div>
      <DataTable<User>
        data={sorted}
        columns={sortableColumns}
        sort={sort}
        onSortChange={setSort}
        striped
        keyExtractor={(item) => String(item.id)}
      />
      <div style={{ fontSize: 13, color: '#6B7280' }}>
        Sorting by: <strong>{sort.key}</strong> ({sort.direction})
      </div>
    </div>
  );
}

export const Sortable: Story = {
  name: 'Sortable',
  render: () => <SortableExample />,
};

// ---------------------------------------------------------------------------
// 3. WithPagination
// ---------------------------------------------------------------------------

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
}

const allProducts: Product[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Product ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
  category: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'][i % 5],
  price: `$${(Math.round((10 + i * 7.3) * 100) / 100).toFixed(2)}`,
  stock: 5 + ((i * 13) % 95),
}));

const productColumns: DataTableColumn<Product>[] = [
  { key: 'id', header: '#', width: 60, align: 'center' },
  { key: 'name', header: 'Product', width: 150 },
  { key: 'category', header: 'Category', width: 120 },
  { key: 'price', header: 'Price', width: 100, align: 'right' },
  { key: 'stock', header: 'Stock', width: 80, align: 'right' },
];

function PaginationExample() {
  const pageSize = 5;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(allProducts.length / pageSize);
  const pageData = allProducts.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionLabel}>Paginated data table ({allProducts.length} items)</div>
      <DataTable<Product>
        data={pageData}
        columns={productColumns}
        striped
        keyExtractor={(item) => String(item.id)}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          Page {page + 1} of {totalPages}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '4px 12px',
              fontSize: 13,
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              background: page === 0 ? '#F3F4F6' : '#fff',
              cursor: page === 0 ? 'default' : 'pointer',
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '4px 12px',
              fontSize: 13,
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              background: page >= totalPages - 1 ? '#F3F4F6' : '#fff',
              cursor: page >= totalPages - 1 ? 'default' : 'pointer',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export const WithPagination: Story = {
  name: 'With Pagination',
  render: () => <PaginationExample />,
};
