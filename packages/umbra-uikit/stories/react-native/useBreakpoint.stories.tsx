import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useBreakpoint } from '@wisp-ui/react-native';

// ---------------------------------------------------------------------------
// Breakpoint thresholds (mirrors the hook source)
// ---------------------------------------------------------------------------

const breakpointThresholds: Record<string, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

// ---------------------------------------------------------------------------
// Demo component that displays current breakpoint
// ---------------------------------------------------------------------------

function BreakpointDemo() {
  const breakpoint = useBreakpoint();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Current Breakpoint
      </div>
      <div
        style={{
          padding: 20,
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#3B82F6',
          }}
        >
          {breakpoint}
        </span>
        <code
          style={{
            fontSize: 12,
            color: '#64748B',
            backgroundColor: '#F8FAFC',
            padding: '4px 8px',
            borderRadius: 4,
          }}
        >
          useBreakpoint() = &quot;{breakpoint}&quot;
        </code>
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        Resize the browser window to see the breakpoint update.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo component showing all breakpoint thresholds
// ---------------------------------------------------------------------------

function BreakpointTableDemo() {
  const breakpoint = useBreakpoint();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Breakpoint Scale
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {breakpointOrder.map((bp) => {
          const isActive = bp === breakpoint;
          return (
            <div
              key={bp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#3B82F6' : '#1E293B',
                  minWidth: 32,
                }}
              >
                {bp}
              </span>
              <span style={{ fontSize: 12, color: '#94A0B8' }}>
                {'\u2265'} {breakpointThresholds[bp]}px
              </span>
              {isActive && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    color: '#3B82F6',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React Native/Hooks/useBreakpoint',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => <BreakpointDemo />,
};

// ---------------------------------------------------------------------------
// 2. ShowBreakpoint
// ---------------------------------------------------------------------------

export const ShowBreakpoint: Story = {
  name: 'ShowBreakpoint',
  render: () => <BreakpointTableDemo />,
};
