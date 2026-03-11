import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from '@wisp-ui/react-native';

const meta: Meta<typeof Pagination> = {
  title: 'React Native/Components/Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    siblingCount: { control: 'number' },
    showFirstLast: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => {
    const Controlled = () => {
      const [page, setPage] = useState(1);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Basic pagination (5 pages)
          </div>
          <Pagination page={page} totalPages={5} onChange={setPage} />
          <div style={{ fontSize: 12, color: '#94A0B8' }}>Current page: {page}</div>
        </div>
      );
    };
    return <Controlled />;
  },
};

// ---------------------------------------------------------------------------
// 2. Many Pages
// ---------------------------------------------------------------------------

export const ManyPages: Story = {
  name: 'Many Pages',
  render: () => {
    const Controlled = () => {
      const [page, setPage] = useState(5);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              20 pages with ellipsis
            </div>
            <Pagination page={page} totalPages={20} onChange={setPage} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              100 pages at page 50
            </div>
            <ManyPagesInner />
          </div>
        </div>
      );
    };

    const ManyPagesInner = () => {
      const [p, setP] = useState(50);
      return <Pagination page={p} totalPages={100} onChange={setP} />;
    };

    return <Controlled />;
  },
};

// ---------------------------------------------------------------------------
// 3. Custom Siblings
// ---------------------------------------------------------------------------

export const CustomSiblings: Story = {
  name: 'Custom Siblings',
  render: () => {
    const SiblingDemo = ({ count }: { count: number }) => {
      const [page, setPage] = useState(5);
      return (
        <div>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            siblingCount = {count}
          </div>
          <Pagination page={page} totalPages={15} onChange={setPage} siblingCount={count} />
        </div>
      );
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <SiblingDemo count={0} />
        <SiblingDemo count={1} />
        <SiblingDemo count={2} />
        <SiblingDemo count={3} />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const SizeDemo = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
      const [page, setPage] = useState(3);
      return (
        <div>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            {size}
          </div>
          <Pagination page={page} totalPages={10} onChange={setPage} size={size} />
        </div>
      );
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <SizeDemo size="sm" />
        <SizeDemo size="md" />
        <SizeDemo size="lg" />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Disabled state
      </div>
      <Pagination page={3} totalPages={10} onChange={() => {}} disabled />
    </div>
  ),
};
