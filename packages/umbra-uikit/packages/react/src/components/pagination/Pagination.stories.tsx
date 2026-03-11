import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';
import { paginationSizes } from '@coexist/wisp-core/types/Pagination.types';
import { Text } from '../../primitives/text';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...paginationSizes] },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

export const Default: Story = {
  name: 'Default',
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>Default (10 pages)</SectionLabel>
        <Pagination page={page} totalPages={10} onChange={setPage} />
        <Text size="sm" color="secondary">Current page: {page}</Text>
      </div>
    );
  },
};

export const ManyPages: Story = {
  name: 'ManyPages',
  render: () => {
    const [page, setPage] = useState(25);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>Many pages (100 pages, siblingCount=2)</SectionLabel>
        <Pagination page={page} totalPages={100} onChange={setPage} siblingCount={2} />
        <Text size="sm" color="secondary">Current page: {page}</Text>
      </div>
    );
  },
};

export const FewPages: Story = {
  name: 'FewPages',
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>Few pages (3 pages)</SectionLabel>
        <Pagination page={page} totalPages={3} onChange={setPage} />
        <Text size="sm" color="secondary">Current page: {page}</Text>
      </div>
    );
  },
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SectionLabel>{size}</SectionLabel>
          <Pagination page={3} totalPages={10} onChange={() => {}} size={size} />
        </div>
      ))}
    </div>
  ),
};

export const NoFirstLast: Story = {
  name: 'NoFirstLast',
  render: () => {
    const [page, setPage] = useState(5);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>No first/last buttons</SectionLabel>
        <Pagination page={page} totalPages={10} onChange={setPage} showFirstLast={false} />
      </div>
    );
  },
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>Disabled</SectionLabel>
      <Pagination page={3} totalPages={10} onChange={() => {}} disabled />
    </div>
  ),
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>Controlled state</SectionLabel>
        <Pagination page={page} totalPages={20} onChange={setPage} siblingCount={2} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Text size="sm" color="secondary">Page: {page} / 20</Text>
        </div>
      </div>
    );
  },
};

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const [page, setPage] = useState(3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 500 }}>
        <SectionLabel>Table footer pattern</SectionLabel>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid #202531',
        }}>
          <Text size="sm" color="secondary">Showing 21-30 of 150</Text>
          <Pagination page={page} totalPages={15} onChange={setPage} size="sm" />
        </div>
      </div>
    );
  },
};
