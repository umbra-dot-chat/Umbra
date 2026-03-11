import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar, SidebarSection, SidebarItem, Text, Badge } from '@wisp-ui/react-native';

const meta: Meta<typeof Sidebar> = {
  title: 'React Native/Layouts/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'select', options: ['compact', 'default', 'wide'] },
    collapsible: { control: 'boolean' },
    collapsed: { control: 'boolean' },
    position: { control: 'select', options: ['left', 'right'] },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

/** Simple circle icon placeholder. */
const DotIcon = ({ color = '#64748B' }: { color?: string }) => (
  <div
    style={{
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: color,
    }}
  />
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div style={{ height: 400, display: 'flex' }}>
      <Sidebar>
        <SidebarItem label="Dashboard" active />
        <SidebarItem label="Projects" />
        <SidebarItem label="Tasks" />
        <SidebarItem label="Settings" />
      </Sidebar>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Sections
// ---------------------------------------------------------------------------

export const WithSections: Story = {
  name: 'With Sections',
  render: () => (
    <div style={{ height: 500, display: 'flex' }}>
      <Sidebar width="default">
        <SidebarSection title="Navigation">
          <SidebarItem icon={<DotIcon color="#3b82f6" />} label="Home" active />
          <SidebarItem icon={<DotIcon color="#64748B" />} label="Explore" />
          <SidebarItem icon={<DotIcon color="#64748B" />} label="Notifications" badge={<Badge size="sm" variant="danger">3</Badge>} />
        </SidebarSection>
        <SidebarSection title="Workspace">
          <SidebarItem icon={<DotIcon color="#64748B" />} label="Projects" />
          <SidebarItem icon={<DotIcon color="#64748B" />} label="Teams" />
          <SidebarItem icon={<DotIcon color="#64748B" />} label="Reports" />
        </SidebarSection>
        <SidebarSection title="Account">
          <SidebarItem icon={<DotIcon color="#64748B" />} label="Settings" />
          <SidebarItem icon={<DotIcon color="#64748B" />} label="Sign out" disabled />
        </SidebarSection>
      </Sidebar>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Collapsed
// ---------------------------------------------------------------------------

export const Collapsed: Story = {
  name: 'Collapsed',
  render: () => {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          Collapsible sidebar (click toggle at bottom)
        </div>
        <div style={{ height: 400, display: 'flex' }}>
          <Sidebar collapsible collapsed={collapsed} onCollapsedChange={setCollapsed}>
            <SidebarSection title="Menu">
              <SidebarItem icon={<DotIcon color="#3b82f6" />} label="Dashboard" active />
              <SidebarItem icon={<DotIcon color="#64748B" />} label="Analytics" />
              <SidebarItem icon={<DotIcon color="#64748B" />} label="Messages" />
              <SidebarItem icon={<DotIcon color="#64748B" />} label="Settings" />
            </SidebarSection>
          </Sidebar>
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 4. Width Variants
// ---------------------------------------------------------------------------

export const WidthVariants: Story = {
  name: 'Width Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['compact', 'default', 'wide'] as const).map((width) => (
        <div key={width}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            width="{width}"
          </div>
          <div style={{ height: 200, display: 'flex', border: '1px dashed #334155', borderRadius: 6 }}>
            <Sidebar width={width}>
              <SidebarItem icon={<DotIcon color="#3b82f6" />} label="Home" active />
              <SidebarItem icon={<DotIcon color="#64748B" />} label="Settings" />
            </Sidebar>
          </div>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Right Position
// ---------------------------------------------------------------------------

export const RightPosition: Story = {
  name: 'Right Position',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>position="right"</div>
      <div style={{ height: 300, display: 'flex', justifyContent: 'flex-end', border: '1px dashed #334155', borderRadius: 6 }}>
        <Sidebar position="right">
          <SidebarSection title="Inspector">
            <SidebarItem icon={<DotIcon color="#8b5cf6" />} label="Properties" active />
            <SidebarItem icon={<DotIcon color="#64748B" />} label="Styles" />
            <SidebarItem icon={<DotIcon color="#64748B" />} label="Layers" />
          </SidebarSection>
        </Sidebar>
      </div>
    </div>
  ),
};
