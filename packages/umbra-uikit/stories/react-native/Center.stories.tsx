import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Center, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Center> = {
  title: 'React Native/Layouts/Center',
  component: Center,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Center>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <Center style={{ width: 240, height: 120, backgroundColor: '#F0F2F5', borderRadius: 8 }}>
      <Text>Centered content</Text>
    </Center>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Dimensions
// ---------------------------------------------------------------------------

export const WithDimensions: Story = {
  name: 'With Dimensions',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionLabel}>Various container sizes</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Center style={{ width: 100, height: 100, backgroundColor: '#DBEAFE', borderRadius: 8 }}>
          <Text style={{ fontSize: 11 }}>100x100</Text>
        </Center>
        <Center style={{ width: 160, height: 80, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
          <Text style={{ fontSize: 11 }}>160x80</Text>
        </Center>
        <Center style={{ width: 200, height: 200, backgroundColor: '#D1FAE5', borderRadius: 8 }}>
          <Text style={{ fontSize: 11 }}>200x200</Text>
        </Center>
      </div>

      <div style={sectionLabel}>Full-width centering</div>
      <Center style={{ width: '100%', height: 60, backgroundColor: '#F3E8FF', borderRadius: 8 }}>
        <Text style={{ fontSize: 12 }}>Full width, height 60</Text>
      </Center>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Content
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={sectionLabel}>Icon-style container</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {(['#6366F1', '#EC4899', '#10B981', '#F59E0B'] as const).map((color) => (
          <Center
            key={color}
            style={{
              width: 48,
              height: 48,
              backgroundColor: color,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
              {color === '#6366F1' ? 'A' : color === '#EC4899' ? 'B' : color === '#10B981' ? 'C' : 'D'}
            </Text>
          </Center>
        ))}
      </div>

      <div style={sectionLabel}>Empty state placeholder</div>
      <Center
        style={{
          width: '100%',
          height: 180,
          backgroundColor: '#F9FAFB',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderStyle: 'dashed',
        }}
      >
        <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '500' }}>No items yet</Text>
        <Text style={{ fontSize: 12, color: '#D1D5DB', marginTop: 4 }}>
          Content will appear here
        </Text>
      </Center>

      <div style={sectionLabel}>Circle avatar</div>
      <Center
        style={{
          width: 64,
          height: 64,
          backgroundColor: '#1E293B',
          borderRadius: 9999,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>JD</Text>
      </Center>
    </div>
  ),
};
