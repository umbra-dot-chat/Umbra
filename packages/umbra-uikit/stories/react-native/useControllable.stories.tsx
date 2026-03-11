import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useControllable } from '@wisp-ui/react-native';

// ---------------------------------------------------------------------------
// Demo component: a simple counter using useControllable
// ---------------------------------------------------------------------------

function CounterDemo({
  value,
  defaultValue = 0,
  onChange,
}: {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
}) {
  const [count, setCount] = useControllable({ value, defaultValue, onChange });

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        {value !== undefined ? 'Controlled' : 'Uncontrolled'} Counter
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setCount(count - 1)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          -
        </button>
        <span style={{ fontSize: 24, fontWeight: 600, minWidth: 40, textAlign: 'center', color: '#1E293B' }}>
          {count}
        </span>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
      <code
        style={{
          fontSize: 12,
          color: '#64748B',
          backgroundColor: '#F8FAFC',
          padding: '4px 8px',
          borderRadius: 4,
        }}
      >
        useControllable({'{'} {value !== undefined ? `value: ${value}` : `defaultValue: ${defaultValue}`} {'}'}) = [{count}, setValue]
      </code>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React Native/Hooks/useControllable',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// 1. Uncontrolled
// ---------------------------------------------------------------------------

export const Uncontrolled: Story = {
  name: 'Uncontrolled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Uncontrolled Mode
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        No external value prop is passed. The hook manages state internally.
      </p>
      <CounterDemo defaultValue={5} />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledWrapper = () => {
      const [externalValue, setExternalValue] = useState(10);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Controlled Mode
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            An external value prop controls the state. The onChange callback updates the parent.
          </p>
          <CounterDemo value={externalValue} onChange={setExternalValue} />
          <div
            style={{
              padding: 12,
              borderRadius: 6,
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: '#64748B' }}>Parent state:</span>
            <code style={{ fontSize: 12, color: '#1E293B' }}>{externalValue}</code>
            <button
              onClick={() => setExternalValue(0)}
              style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: '#FFF',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Reset to 0
            </button>
          </div>
        </div>
      );
    };
    return <ControlledWrapper />;
  },
};
