import React from 'react';
import { Tabs, TabList, Tab, TabPanel, Text, VStack } from '@wisp-ui/react';
import { Settings, User, Bell } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const tabsEntry: ComponentEntry = {
  slug: 'tabs',
  name: 'Tabs',
  category: 'components',
  subcategory: 'Navigation',
  description:
    'Compound tab component with accessible keyboard navigation. Supports horizontal/vertical orientation, icons, disabled tabs, and controlled/uncontrolled modes.',
  variantCount: 2,
  keywords: ['tabs', 'tab', 'navigation', 'panel', 'switch'],

  cardPreview: (
    <Tabs defaultValue="general" style={{ width: '100%', maxWidth: 300 }}>
      <TabList>
        <Tab value="general">General</Tab>
        <Tab value="profile">Profile</Tab>
        <Tab value="notifs">Notifications</Tab>
      </TabList>
    </Tabs>
  ),

  examples: [
    {
      title: 'Basic Usage',
      render: (
        <Tabs defaultValue="general" style={{ width: '100%', maxWidth: 400 }}>
          <TabList>
            <Tab value="general">General</Tab>
            <Tab value="profile">Profile</Tab>
            <Tab value="billing">Billing</Tab>
          </TabList>
          <TabPanel value="general">
            <div style={{ padding: '16px 0' }}>
              <Text color="secondary">General settings content goes here.</Text>
            </div>
          </TabPanel>
          <TabPanel value="profile">
            <div style={{ padding: '16px 0' }}>
              <Text color="secondary">Profile settings content goes here.</Text>
            </div>
          </TabPanel>
          <TabPanel value="billing">
            <div style={{ padding: '16px 0' }}>
              <Text color="secondary">Billing settings content goes here.</Text>
            </div>
          </TabPanel>
        </Tabs>
      ),
      code: `import { Tabs, TabList, Tab, TabPanel } from '@wisp-ui/react';\n\n<Tabs defaultValue="general">
  <TabList>
    <Tab value="general">General</Tab>
    <Tab value="profile">Profile</Tab>
    <Tab value="billing">Billing</Tab>
  </TabList>
  <TabPanel value="general">General settings content.</TabPanel>
  <TabPanel value="profile">Profile settings content.</TabPanel>
  <TabPanel value="billing">Billing settings content.</TabPanel>
</Tabs>`,
      rnCode: `import { Tabs, TabList, Tab, TabPanel } from '@wisp-ui/react-native';

<Tabs defaultValue="general">
  <TabList>
    <Tab value="general">General</Tab>
    <Tab value="profile">Profile</Tab>
    <Tab value="billing">Billing</Tab>
  </TabList>
  <TabPanel value="general">General settings content.</TabPanel>
  <TabPanel value="profile">Profile settings content.</TabPanel>
  <TabPanel value="billing">Billing settings content.</TabPanel>
</Tabs>`,
    },
    {
      title: 'With Icons',
      render: (
        <Tabs defaultValue="account" style={{ width: '100%', maxWidth: 400 }}>
          <TabList>
            <Tab value="account" icon={<User size={14} />}>Account</Tab>
            <Tab value="settings" icon={<Settings size={14} />}>Settings</Tab>
            <Tab value="notifications" icon={<Bell size={14} />}>Notifications</Tab>
          </TabList>
          <TabPanel value="account">
            <div style={{ padding: '16px 0' }}>
              <Text color="secondary">Account details.</Text>
            </div>
          </TabPanel>
          <TabPanel value="settings">
            <div style={{ padding: '16px 0' }}>
              <Text color="secondary">App settings.</Text>
            </div>
          </TabPanel>
          <TabPanel value="notifications">
            <div style={{ padding: '16px 0' }}>
              <Text color="secondary">Notification preferences.</Text>
            </div>
          </TabPanel>
        </Tabs>
      ),
      code: `<Tabs defaultValue="account">
  <TabList>
    <Tab value="account" icon={<User size={14} />}>Account</Tab>
    <Tab value="settings" icon={<Settings size={14} />}>Settings</Tab>
    <Tab value="notifications" icon={<Bell size={14} />}>Notifications</Tab>
  </TabList>
  <TabPanel value="account">Account details.</TabPanel>
  <TabPanel value="settings">App settings.</TabPanel>
  <TabPanel value="notifications">Notification preferences.</TabPanel>
</Tabs>`,
      rnCode: `import { Tabs, TabList, Tab, TabPanel } from '@wisp-ui/react-native';
import { User, Settings, Bell } from 'lucide-react-native';

<Tabs defaultValue="account">
  <TabList>
    <Tab value="account" icon={<User size={14} />}>Account</Tab>
    <Tab value="settings" icon={<Settings size={14} />}>Settings</Tab>
    <Tab value="notifications" icon={<Bell size={14} />}>Notifications</Tab>
  </TabList>
  <TabPanel value="account">Account details.</TabPanel>
  <TabPanel value="settings">App settings.</TabPanel>
  <TabPanel value="notifications">Notification preferences.</TabPanel>
</Tabs>`,
    },
    {
      title: 'Disabled Tab',
      render: (
        <Tabs defaultValue="active" style={{ width: '100%', maxWidth: 400 }}>
          <TabList>
            <Tab value="active">Active</Tab>
            <Tab value="disabled" disabled>Disabled</Tab>
            <Tab value="another">Another</Tab>
          </TabList>
        </Tabs>
      ),
      code: `<Tabs defaultValue="active">
  <TabList>
    <Tab value="active">Active</Tab>
    <Tab value="disabled" disabled>Disabled</Tab>
    <Tab value="another">Another</Tab>
  </TabList>
</Tabs>`,
      rnCode: `import { Tabs, TabList, Tab } from '@wisp-ui/react-native';

<Tabs defaultValue="active">
  <TabList>
    <Tab value="active">Active</Tab>
    <Tab value="disabled" disabled>Disabled</Tab>
    <Tab value="another">Another</Tab>
  </TabList>
</Tabs>`,
    },
  ],

  props: [
    { name: 'value', type: 'string', description: 'Controlled active tab value.' },
    { name: 'defaultValue', type: 'string', default: "''", description: 'Initial active tab for uncontrolled mode.' },
    { name: 'onChange', type: '(value: string) => void', description: 'Callback when the active tab changes.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout orientation of the tab list.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'TabList and TabPanel children.' },
  ],
};
