import React from 'react';
import { Sidebar, SidebarSection, SidebarItem, Text, VStack, Box, useThemeColors } from '@wisp-ui/react';
import { Home, Settings, Users, FileText } from 'lucide-react';
import type { ComponentEntry } from '../types';

function SidebarBasicExample() {
  const colors = useThemeColors();
  return (
    <Box style={{ width: 240, border: `1px solid ${colors.border.subtle}`, borderRadius: 8, overflow: 'hidden' }}>
      <Sidebar>
        <SidebarSection title="Main">
          <SidebarItem icon={<Home size={16} />} label="Dashboard" active />
          <SidebarItem icon={<Users size={16} />} label="Users" />
          <SidebarItem icon={<FileText size={16} />} label="Documents" badge={<Text size="xs" color="secondary">12</Text>} />
        </SidebarSection>
        <SidebarSection title="System">
          <SidebarItem icon={<Settings size={16} />} label="Settings" />
        </SidebarSection>
      </Sidebar>
    </Box>
  );
}

function SidebarWidthExample() {
  const colors = useThemeColors();
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {(['compact', 'default'] as const).map((w) => (
        <Box key={w} style={{ border: `1px solid ${colors.border.subtle}`, borderRadius: 8, overflow: 'hidden' }}>
          <Sidebar width={w}>
            <SidebarSection>
              <SidebarItem icon={<Home size={16} />} label="Home" active />
              <SidebarItem icon={<Settings size={16} />} label="Settings" />
            </SidebarSection>
          </Sidebar>
        </Box>
      ))}
    </div>
  );
}

export const sidebarEntry: ComponentEntry = {
  slug: 'sidebar',
  name: 'Sidebar',
  category: 'layouts',
  subcategory: 'Navigation & Wayfinding',
  description:
    'Navigation sidebar with sections, items, icons, badges, active state, and collapsible width presets.',
  variantCount: 4,
  keywords: ['sidebar', 'navigation', 'menu', 'drawer', 'nav'],

  cardPreview: (
    <Box style={{ width: '100%', maxWidth: 180, pointerEvents: 'none' }}>
      <Sidebar width="compact">
        <SidebarSection>
          <SidebarItem icon={<Home size={16} />} label="Home" active />
          <SidebarItem icon={<Users size={16} />} label="Team" />
          <SidebarItem icon={<Settings size={16} />} label="Settings" />
        </SidebarSection>
      </Sidebar>
    </Box>
  ),

  examples: [
    {
      title: 'Basic',
      render: <SidebarBasicExample />,
      code: `import { Sidebar, SidebarSection, SidebarItem } from '@wisp-ui/react';

<Sidebar>
  <SidebarSection title="Main">
    <SidebarItem icon={<Home />} label="Dashboard" active />
    <SidebarItem icon={<Users />} label="Users" />
    <SidebarItem icon={<FileText />} label="Documents" badge="12" />
  </SidebarSection>
</Sidebar>`,
      rnCode: `import { Sidebar, SidebarSection, SidebarItem } from '@wisp-ui/react-native';

<Sidebar>
  <SidebarSection title="Main">
    <SidebarItem icon={<Home />} label="Dashboard" active />
    <SidebarItem icon={<Users />} label="Users" />
    <SidebarItem icon={<FileText />} label="Documents" />
  </SidebarSection>
</Sidebar>`,
    },
    {
      title: 'Width Presets',
      render: <SidebarWidthExample />,
      code: `<Sidebar width="compact">…</Sidebar>
<Sidebar width="default">…</Sidebar>`,
      rnCode: `<Sidebar width="compact">…</Sidebar>
<Sidebar width="default">…</Sidebar>`,
    },
  ],

  props: [
    { name: 'width', type: "'collapsed' | 'compact' | 'default' | 'wide'", default: "'default'", description: 'Width preset (48–320px).' },
    { name: 'collapsible', type: 'boolean', default: 'false', description: 'Support collapsing.' },
    { name: 'collapsed', type: 'boolean', description: 'Controlled collapsed state.' },
    { name: 'onCollapsedChange', type: '(collapsed: boolean) => void', description: 'Collapse callback.' },
    { name: 'position', type: "'left' | 'right'", default: "'left'", description: 'Sidebar position.' },
  ],
};
