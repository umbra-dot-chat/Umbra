import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@wisp-ui/react-native';

const meta: Meta<typeof Table> = {
  title: 'React Native/Components/Data Display/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['default', 'striped'] },
    hoverable: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    size: 'md',
    variant: 'default',
  },
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead width={160}>Name</TableHead>
          <TableHead width={200}>Email</TableHead>
          <TableHead width={100} align="right">Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell width={160}>Alice Johnson</TableCell>
          <TableCell width={200}>alice@example.com</TableCell>
          <TableCell width={100} align="right">Admin</TableCell>
        </TableRow>
        <TableRow>
          <TableCell width={160}>Bob Smith</TableCell>
          <TableCell width={200}>bob@example.com</TableCell>
          <TableCell width={100} align="right">Editor</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// ---------------------------------------------------------------------------
// 2. WithData
// ---------------------------------------------------------------------------

const employees = [
  { name: 'Alice Johnson', department: 'Engineering', title: 'Senior Developer', salary: '$145,000' },
  { name: 'Bob Smith', department: 'Design', title: 'UX Lead', salary: '$128,000' },
  { name: 'Carol Lee', department: 'Marketing', title: 'Campaign Manager', salary: '$98,000' },
  { name: 'David Kim', department: 'Engineering', title: 'DevOps Engineer', salary: '$135,000' },
  { name: 'Eva Martinez', department: 'Sales', title: 'Account Executive', salary: '$92,000' },
];

export const WithData: Story = {
  name: 'With Data',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionLabel}>Employee directory</div>
      <Table size="md">
        <TableHeader>
          <TableRow>
            <TableHead width={160}>Name</TableHead>
            <TableHead width={130}>Department</TableHead>
            <TableHead width={170}>Title</TableHead>
            <TableHead width={110} align="right">Salary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
            <TableRow key={emp.name}>
              <TableCell width={160}>{emp.name}</TableCell>
              <TableCell width={130}>{emp.department}</TableCell>
              <TableCell width={170}>{emp.title}</TableCell>
              <TableCell width={110} align="right">{emp.salary}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Striped
// ---------------------------------------------------------------------------

export const Striped: Story = {
  name: 'Striped',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={sectionLabel}>Striped variant</div>
      <Table variant="striped" size="md">
        <TableHeader>
          <TableRow>
            <TableHead width={60} align="center">#</TableHead>
            <TableHead width={160}>Product</TableHead>
            <TableHead width={100} align="center">SKU</TableHead>
            <TableHead width={80} align="right">Qty</TableHead>
            <TableHead width={100} align="right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            { id: 1, product: 'Widget A', sku: 'WA-001', qty: 24, price: '$12.99' },
            { id: 2, product: 'Widget B', sku: 'WB-002', qty: 18, price: '$15.49' },
            { id: 3, product: 'Gadget C', sku: 'GC-003', qty: 42, price: '$8.75' },
            { id: 4, product: 'Gadget D', sku: 'GD-004', qty: 7, price: '$24.00' },
            { id: 5, product: 'Doohickey E', sku: 'DE-005', qty: 33, price: '$6.50' },
            { id: 6, product: 'Thingamajig F', sku: 'TF-006', qty: 15, price: '$19.99' },
          ].map((row) => (
            <TableRow key={row.id}>
              <TableCell width={60} align="center">{row.id}</TableCell>
              <TableCell width={160}>{row.product}</TableCell>
              <TableCell width={100} align="center">{row.sku}</TableCell>
              <TableCell width={80} align="right">{row.qty}</TableCell>
              <TableCell width={100} align="right">{row.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div style={sectionLabel}>Sizes comparison (striped)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>{size}</div>
            <Table variant="striped" size={size}>
              <TableHeader>
                <TableRow>
                  <TableHead width={140}>Name</TableHead>
                  <TableHead width={100} align="right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell width={140}>Alpha</TableCell>
                  <TableCell width={100} align="right">100</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell width={140}>Beta</TableCell>
                  <TableCell width={100} align="right">200</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell width={140}>Gamma</TableCell>
                  <TableCell width={100} align="right">300</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  ),
};
