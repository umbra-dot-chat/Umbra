import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from '@wisp-ui/react';
import { tableSizes, tableVariants } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';

const meta: Meta<typeof Table> = {
  title: 'React/Components/Data Display/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...tableSizes] },
    variant: { control: 'select', options: [...tableVariants] },
    hoverable: { control: 'boolean' },
    stickyHeader: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    size="xs"
    color="tertiary"
    weight="semibold"
    as="div"
    style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}
  >
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleRows = [
  { id: 1, name: 'Alice Johnson', role: 'Engineer', status: 'Active', amount: '$4,200' },
  { id: 2, name: 'Bob Smith', role: 'Designer', status: 'Active', amount: '$3,800' },
  { id: 3, name: 'Carol Lee', role: 'Product Manager', status: 'On Leave', amount: '$5,100' },
  { id: 4, name: 'Dan Brown', role: 'Engineer', status: 'Active', amount: '$4,500' },
  { id: 5, name: 'Eve Davis', role: 'QA Lead', status: 'Active', amount: '$3,900' },
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead align="right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell align="right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {tableSizes.map((size) => (
        <div key={size}>
          <SectionLabel>{size}</SectionLabel>
          <Table size={size}>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead align="right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleRows.slice(0, 3).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell align="right">{row.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  ),
};

export const Striped: Story = {
  name: 'Striped',
  render: () => (
    <Table variant="striped">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead align="right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell align="right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Hoverable: Story = {
  name: 'Hoverable',
  render: () => (
    <Table hoverable>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead align="right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell align="right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const StickyHeader: Story = {
  name: 'Sticky Header',
  render: () => {
    const manyRows = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      role: i % 3 === 0 ? 'Engineer' : i % 3 === 1 ? 'Designer' : 'Manager',
      amount: `$${(3000 + i * 100).toLocaleString()}`,
    }));

    return (
      <div style={{ maxHeight: 320, overflow: 'auto' }}>
        <Table stickyHeader hoverable>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead align="right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manyRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell align="right">{row.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};

export const WithFooter: Story = {
  name: 'With Footer',
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead align="right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell align="right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell />
          <TableCell align="right">$21,500</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <SectionLabel>Team members</SectionLabel>
      <Table size="md" variant="striped" hoverable>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Salary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.role}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell align="right">{row.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total (5 members)</TableCell>
            <TableCell />
            <TableCell />
            <TableCell align="right">$21,500</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
};
