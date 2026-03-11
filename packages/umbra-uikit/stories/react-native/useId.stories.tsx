import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useId } from '@wisp-ui/react-native';

// ---------------------------------------------------------------------------
// Demo component showing a single generated ID
// ---------------------------------------------------------------------------

function IdDemo({ prefix }: { prefix?: string }) {
  const id = useId(prefix);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Generated ID
      </div>
      <code
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#1E293B',
          backgroundColor: '#F8FAFC',
          padding: '6px 10px',
          borderRadius: 4,
        }}
      >
        {id}
      </code>
      <code
        style={{
          fontSize: 12,
          color: '#64748B',
          backgroundColor: '#F8FAFC',
          padding: '4px 8px',
          borderRadius: 4,
        }}
      >
        useId({prefix ? `"${prefix}"` : ''}) = &quot;{id}&quot;
      </code>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo component showing multiple IDs
// ---------------------------------------------------------------------------

function MultipleIdsDemo() {
  const defaultId = useId();
  const inputId = useId('input');
  const labelId = useId('label');
  const modalId = useId('modal');

  const ids = [
    { call: 'useId()', value: defaultId },
    { call: 'useId("input")', value: inputId },
    { call: 'useId("label")', value: labelId },
    { call: 'useId("modal")', value: modalId },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Multiple IDs with Different Prefixes
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ids.map(({ call, value }) => (
          <div
            key={call}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
            }}
          >
            <code style={{ fontSize: 12, color: '#64748B', minWidth: 160 }}>
              {call}
            </code>
            <span style={{ color: '#94A0B8' }}>{'\u2192'}</span>
            <code style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6' }}>
              {value}
            </code>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        Each call produces a unique, stable ID. Uses React 18&apos;s useId when available,
        otherwise falls back to a monotonic counter.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React Native/Hooks/useId',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => <IdDemo />,
};

// ---------------------------------------------------------------------------
// 2. Multiple
// ---------------------------------------------------------------------------

export const Multiple: Story = {
  name: 'Multiple',
  render: () => <MultipleIdsDemo />,
};
