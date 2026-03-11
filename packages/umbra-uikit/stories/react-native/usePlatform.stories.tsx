import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { usePlatform } from '@wisp-ui/react-native';

// ---------------------------------------------------------------------------
// Demo component that displays platform info
// ---------------------------------------------------------------------------

function PlatformDemo() {
  const { platform, isWeb, isIOS, isAndroid, isNative } = usePlatform();

  const flags = [
    { label: 'platform', value: platform },
    { label: 'isWeb', value: isWeb },
    { label: 'isIOS', value: isIOS },
    { label: 'isAndroid', value: isAndroid },
    { label: 'isNative', value: isNative },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        usePlatform Result
      </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>
            {platform}
          </span>
          <span
            style={{
              fontSize: 11,
              color: '#FFF',
              backgroundColor: isWeb ? '#3B82F6' : isIOS ? '#000' : '#22C55E',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {isNative ? 'Native' : 'Web'}
          </span>
        </div>

        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Flags
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {flags.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code
                style={{
                  fontSize: 12,
                  color: '#64748B',
                  backgroundColor: '#F8FAFC',
                  padding: '2px 6px',
                  borderRadius: 3,
                  minWidth: 100,
                }}
              >
                {label}
              </code>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: value === true ? '#22C55E' : value === false ? '#94A0B8' : '#1E293B',
                }}
              >
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        In Storybook (web), the platform will be &quot;web&quot; since React Native Web is
        used under the hood. On a real device, it would report &quot;ios&quot; or &quot;android&quot;.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React Native/Hooks/usePlatform',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => <PlatformDemo />,
};
