import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useLoading, LoadingContext } from '@wisp-ui/react-native';

// ---------------------------------------------------------------------------
// Wrapper component that consumes the LoadingContext via useLoading
// ---------------------------------------------------------------------------

function LoadingDisplay() {
  const isLoading = useLoading();
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
        useLoading Result
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isLoading ? '#F59E0B' : '#22C55E',
          }}
        />
        <span style={{ fontSize: 14, color: '#1E293B' }}>
          {isLoading ? 'Loading...' : 'Not loading'}
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
        useLoading() = {String(isLoading)}
      </code>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wrapper that provides LoadingContext
// ---------------------------------------------------------------------------

function LoadingStoryWrapper({ loading }: { loading: boolean }) {
  return (
    <LoadingContext.Provider value={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          LoadingContext.Provider value={'{'}
          {String(loading)}
          {'}'}
        </div>
        <LoadingDisplay />
      </div>
    </LoadingContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof LoadingStoryWrapper> = {
  title: 'React Native/Hooks/useLoading',
  component: LoadingStoryWrapper,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingStoryWrapper>;

// ---------------------------------------------------------------------------
// 1. Default (not loading)
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  args: {
    loading: false,
  },
};

// ---------------------------------------------------------------------------
// 2. Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading',
  args: {
    loading: true,
  },
};
