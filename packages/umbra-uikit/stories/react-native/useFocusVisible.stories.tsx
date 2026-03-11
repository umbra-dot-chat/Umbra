import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useFocusVisible } from '@wisp-ui/react-native';

// ---------------------------------------------------------------------------
// Wrapper component that uses useFocusVisible
// ---------------------------------------------------------------------------

function FocusVisibleDemo() {
  const { isFocusVisible, focusProps } = useFocusVisible();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        useFocusVisible Result
      </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: isFocusVisible ? '#3B82F6' : '#94A0B8',
            }}
          />
          <span style={{ fontSize: 14, color: '#1E293B' }}>
            isFocusVisible: {String(isFocusVisible)}
          </span>
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
          focusProps: {JSON.stringify(focusProps)}
        </code>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
          On React Native, keyboard tab-focus navigation does not exist in the same way as
          on the web. This hook always returns isFocusVisible: false and an empty focusProps
          object, matching the web hook interface for cross-platform compatibility.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React Native/Hooks/useFocusVisible',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => <FocusVisibleDemo />,
};
