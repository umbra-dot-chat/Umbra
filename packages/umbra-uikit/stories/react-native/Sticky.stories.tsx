import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Sticky, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Sticky> = {
  title: 'React Native/Layouts/Sticky',
  component: Sticky,
  tags: ['autodocs'],
  argTypes: {
    edge: { control: 'select', options: ['top', 'bottom'] },
    offset: { control: 'number' },
    zIndex: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Sticky>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

const StickyBar = ({ label, color = '#3b82f6' }: { label: string; color?: string }) => (
  <div
    style={{
      backgroundColor: color,
      padding: '10px 16px',
      borderRadius: 6,
    }}
  >
    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{label}</Text>
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    edge: 'top',
    offset: 0,
  },
  render: (args) => (
    <div style={{ position: 'relative', height: 240, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
      <Sticky {...args}>
        <StickyBar label="Sticky Header (top)" />
      </Sticky>
      <div style={{ padding: 16, paddingTop: 56 }}>
        <Text style={{ color: '#6B7280', fontSize: 13 }}>
          Content below the sticky element. The Sticky component is absolutely positioned at the top edge.
        </Text>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. WithOffset
// ---------------------------------------------------------------------------

export const WithOffset: Story = {
  name: 'With Offset',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>edge="top" offset=0</div>
        <div style={{ position: 'relative', height: 160, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
          <Sticky edge="top" offset={0}>
            <StickyBar label="Top, offset: 0" color="#3b82f6" />
          </Sticky>
          <div style={{ padding: 16, paddingTop: 56 }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>Content area</Text>
          </div>
        </div>
      </div>

      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>edge="top" offset=16</div>
        <div style={{ position: 'relative', height: 160, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
          <Sticky edge="top" offset={16}>
            <StickyBar label="Top, offset: 16" color="#8b5cf6" />
          </Sticky>
          <div style={{ padding: 16, paddingTop: 72 }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>Content area with 16px offset from top</Text>
          </div>
        </div>
      </div>

      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>edge="bottom" offset=0</div>
        <div style={{ position: 'relative', height: 160, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: 16 }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>Content area</Text>
          </div>
          <Sticky edge="bottom" offset={0}>
            <StickyBar label="Bottom, offset: 0" color="#ec4899" />
          </Sticky>
        </div>
      </div>

      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>edge="bottom" offset=12</div>
        <div style={{ position: 'relative', height: 160, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: 16 }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>Content area with 12px offset from bottom</Text>
          </div>
          <Sticky edge="bottom" offset={12}>
            <StickyBar label="Bottom, offset: 12" color="#f59e0b" />
          </Sticky>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. WithContent
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Sticky header and footer</div>
        <div style={{ position: 'relative', height: 300, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
          <Sticky edge="top">
            <div style={{ backgroundColor: '#1e293b', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>App Header</Text>
              <Text style={{ color: '#94A0B8', fontSize: 12 }}>Navigation</Text>
            </div>
          </Sticky>

          <div style={{ padding: 16, paddingTop: 56, paddingBottom: 56 }}>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Page Content</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>
              This demonstrates a layout with both a sticky header and a sticky footer.
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>
              The header stays pinned to the top and the footer stays pinned to the bottom.
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>
              The main content area sits between them.
            </Text>
          </div>

          <Sticky edge="bottom">
            <div style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Sticky Footer</Text>
            </div>
          </Sticky>
        </div>
      </div>
    </div>
  ),
};
