import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar, SidebarSection, SidebarItem } from '@wisp-ui/react';
import { sidebarWidths } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Icon } from '@wisp-ui/react';
import { Badge } from '@wisp-ui/react';
import {
  Home,
  Users,
  Settings,
  Inbox,
  FileText,
  BarChart3,
  Bell,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Sidebar> = {
  title: 'React/Layouts/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'select', options: [...sidebarWidths] },
    position: { control: 'select', options: ['left', 'right'] },
    collapsible: { control: 'boolean' },
    collapsed: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// Wrapper to give the sidebar a visible height
const SidebarFrame = ({ children, height = 500 }: { children: React.ReactNode; height?: number }) => (
  <div style={{ height, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default — basic sidebar with items
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <SidebarFrame>
      <Sidebar>
        <SidebarSection>
          <SidebarItem icon={<Icon icon={Home} size="sm" />} label="Dashboard" active />
          <SidebarItem icon={<Icon icon={Inbox} size="sm" />} label="Inbox" />
          <SidebarItem icon={<Icon icon={FileText} size="sm" />} label="Documents" />
          <SidebarItem icon={<Icon icon={BarChart3} size="sm" />} label="Analytics" />
          <SidebarItem icon={<Icon icon={Users} size="sm" />} label="Team" />
          <SidebarItem icon={<Icon icon={Settings} size="sm" />} label="Settings" />
        </SidebarSection>
      </Sidebar>
    </SidebarFrame>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Sections — grouped navigation
// ---------------------------------------------------------------------------

export const WithSections: Story = {
  name: 'With Sections',
  render: () => (
    <SidebarFrame>
      <Sidebar>
        <SidebarSection title="Overview">
          <SidebarItem icon={<Icon icon={Home} size="sm" />} label="Dashboard" active />
          <SidebarItem icon={<Icon icon={Inbox} size="sm" />} label="Inbox" />
          <SidebarItem icon={<Icon icon={BarChart3} size="sm" />} label="Analytics" />
        </SidebarSection>

        <SidebarSection title="Content" collapsible>
          <SidebarItem icon={<Icon icon={FileText} size="sm" />} label="Documents" />
          <SidebarItem icon={<Icon icon={Users} size="sm" />} label="Team" />
        </SidebarSection>

        <SidebarSection title="System" collapsible defaultCollapsed>
          <SidebarItem icon={<Icon icon={Settings} size="sm" />} label="Settings" />
          <SidebarItem icon={<Icon icon={HelpCircle} size="sm" />} label="Help" />
        </SidebarSection>
      </Sidebar>
    </SidebarFrame>
  ),
};

// ---------------------------------------------------------------------------
// 3. Collapsed — icon-only mode
// ---------------------------------------------------------------------------

export const Collapsed: Story = {
  name: 'Collapsed',
  render: () => {
    const CollapsedDemo = () => {
      const [collapsed, setCollapsed] = useState(false);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionLabel>Toggle collapsed state</SectionLabel>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
          <SidebarFrame>
            <Sidebar collapsible collapsed={collapsed} onCollapsedChange={setCollapsed}>
              <SidebarSection>
                <SidebarItem icon={<Icon icon={Home} size="sm" />} label="Dashboard" active />
                <SidebarItem icon={<Icon icon={Inbox} size="sm" />} label="Inbox" />
                <SidebarItem icon={<Icon icon={FileText} size="sm" />} label="Documents" />
                <SidebarItem icon={<Icon icon={BarChart3} size="sm" />} label="Analytics" />
                <SidebarItem icon={<Icon icon={Settings} size="sm" />} label="Settings" />
              </SidebarSection>
            </Sidebar>
          </SidebarFrame>
        </div>
      );
    };

    return <CollapsedDemo />;
  },
};

// ---------------------------------------------------------------------------
// 4. With Badges — notification counts
// ---------------------------------------------------------------------------

export const WithBadges: Story = {
  name: 'With Badges',
  render: () => (
    <SidebarFrame>
      <Sidebar>
        <SidebarSection title="Navigation">
          <SidebarItem icon={<Icon icon={Home} size="sm" />} label="Dashboard" active />
          <SidebarItem
            icon={<Icon icon={Inbox} size="sm" />}
            label="Inbox"
            badge={<Badge size="sm" variant="danger">12</Badge>}
          />
          <SidebarItem
            icon={<Icon icon={Bell} size="sm" />}
            label="Notifications"
            badge={<Badge size="sm" variant="warning">3</Badge>}
          />
          <SidebarItem icon={<Icon icon={FileText} size="sm" />} label="Documents" />
          <SidebarItem
            icon={<Icon icon={BarChart3} size="sm" />}
            label="Analytics"
            badge={<Badge size="sm" variant="info">New</Badge>}
          />
          <SidebarItem icon={<Icon icon={Users} size="sm" />} label="Team" />
          <SidebarItem icon={<Icon icon={Settings} size="sm" />} label="Settings" disabled />
        </SidebarSection>
      </Sidebar>
    </SidebarFrame>
  ),
};

// ---------------------------------------------------------------------------
// 5. Width Variants — collapsed, compact, default, wide
// ---------------------------------------------------------------------------

export const WidthVariants: Story = {
  name: 'Width Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      {sidebarWidths.map((widthVariant) => (
        <div key={widthVariant}>
          <SectionLabel>{widthVariant}</SectionLabel>
          <SidebarFrame height={260}>
            <Sidebar width={widthVariant}>
              <SidebarSection>
                <SidebarItem icon={<Icon icon={Home} size="sm" />} label="Dashboard" active />
                <SidebarItem icon={<Icon icon={Inbox} size="sm" />} label="Inbox" />
                <SidebarItem icon={<Icon icon={FileText} size="sm" />} label="Documents" />
                <SidebarItem icon={<Icon icon={Settings} size="sm" />} label="Settings" />
              </SidebarSection>
            </Sidebar>
            <div style={{ flex: 1 }} />
          </SidebarFrame>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Composition — full application-like sidebar
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <SidebarFrame height={600}>
      <Sidebar width="default" position="left">
        <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
            W
          </div>
          <Text size="sm" weight="semibold">Wisp App</Text>
        </div>

        <SidebarSection title="Main">
          <SidebarItem icon={<Icon icon={Home} size="sm" />} label="Dashboard" active />
          <SidebarItem
            icon={<Icon icon={Inbox} size="sm" />}
            label="Inbox"
            badge={<Badge size="sm" variant="danger">5</Badge>}
          />
          <SidebarItem icon={<Icon icon={BarChart3} size="sm" />} label="Analytics" />
        </SidebarSection>

        <SidebarSection title="Content" collapsible>
          <SidebarItem icon={<Icon icon={FileText} size="sm" />} label="Documents" />
          <SidebarItem icon={<Icon icon={Users} size="sm" />} label="Team" />
        </SidebarSection>

        <SidebarSection title="Settings" collapsible>
          <SidebarItem icon={<Icon icon={Settings} size="sm" />} label="Preferences" />
          <SidebarItem
            icon={<Icon icon={Bell} size="sm" />}
            label="Notifications"
            badge={<Badge size="sm" variant="warning">2</Badge>}
          />
          <SidebarItem icon={<Icon icon={HelpCircle} size="sm" />} label="Help Center" />
        </SidebarSection>
      </Sidebar>

      <div style={{ flex: 1, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text size="sm" color="tertiary">Main content area</Text>
      </div>
    </SidebarFrame>
  ),
};
