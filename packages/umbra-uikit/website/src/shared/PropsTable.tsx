import React from 'react';
import {
  DataTable,
  Text,
  Badge,
} from '@wisp-ui/react';
import type { DataTableColumn } from '@wisp-ui/react';
import type { PropDef } from '../registry/types';

interface PropsTableProps {
  props: PropDef[];
}

const columns: DataTableColumn<PropDef>[] = [
  {
    key: 'name',
    header: 'Prop',
    width: 160,
    render: (_value: any, row: PropDef) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Text size="sm" weight="semibold" family="mono">
          {row.name}
        </Text>
        {row.required && (
          <Badge size="sm" variant="danger">
            required
          </Badge>
        )}
      </span>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    width: 200,
    render: (value: any) => (
      <Text size="xs" family="mono" color="secondary">
        {value}
      </Text>
    ),
  },
  {
    key: 'default',
    header: 'Default',
    width: 120,
    render: (value: any) => (
      <Text size="xs" family="mono" color="tertiary">
        {value ?? '—'}
      </Text>
    ),
  },
  {
    key: 'description',
    header: 'Description',
    render: (value: any) => (
      <Text size="sm" color="secondary">
        {value}
      </Text>
    ),
  },
];

export function PropsTable({ props }: PropsTableProps) {
  if (props.length === 0) return null;

  return (
    <DataTable<PropDef>
      data={props}
      columns={columns}
      size="sm"
      variant="card"
      hoverable
      striped={false}
    />
  );
}
