import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabList, Tab, TabPanel } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Icon } from '@wisp-ui/react';
import { User, Settings, Bell } from 'lucide-react';

const meta: Meta<typeof Tabs> = {
  title: 'React/Components/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabList>
        <Tab value="account">Account</Tab>
        <Tab value="security">Security</Tab>
        <Tab value="notifications">Notifications</Tab>
      </TabList>
      <TabPanel value="account">
        <Text size="sm" color="secondary">Manage your account settings and preferences.</Text>
      </TabPanel>
      <TabPanel value="security">
        <Text size="sm" color="secondary">Update your password and security options.</Text>
      </TabPanel>
      <TabPanel value="notifications">
        <Text size="sm" color="secondary">Configure notification preferences.</Text>
      </TabPanel>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <Tabs defaultValue="profile">
      <TabList>
        <Tab value="profile" icon={<Icon icon={User} size="xs" />}>Profile</Tab>
        <Tab value="settings" icon={<Icon icon={Settings} size="xs" />}>Settings</Tab>
        <Tab value="alerts" icon={<Icon icon={Bell} size="xs" />}>Alerts</Tab>
      </TabList>
      <TabPanel value="profile">
        <Text size="sm" color="secondary">Your profile information.</Text>
      </TabPanel>
      <TabPanel value="settings">
        <Text size="sm" color="secondary">Application settings.</Text>
      </TabPanel>
      <TabPanel value="alerts">
        <Text size="sm" color="secondary">Alert configuration.</Text>
      </TabPanel>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  name: 'Disabled Tab',
  render: () => (
    <Tabs defaultValue="tab1">
      <TabList>
        <Tab value="tab1">Active</Tab>
        <Tab value="tab2" disabled>Disabled</Tab>
        <Tab value="tab3">Another</Tab>
      </TabList>
      <TabPanel value="tab1">
        <Text size="sm" color="secondary">First panel content.</Text>
      </TabPanel>
      <TabPanel value="tab2">
        <Text size="sm" color="secondary">This panel is unreachable.</Text>
      </TabPanel>
      <TabPanel value="tab3">
        <Text size="sm" color="secondary">Third panel content.</Text>
      </TabPanel>
    </Tabs>
  ),
};

export const Vertical: Story = {
  name: 'Vertical',
  render: () => (
    <Tabs defaultValue="general" orientation="vertical">
      <TabList>
        <Tab value="general">General</Tab>
        <Tab value="appearance">Appearance</Tab>
        <Tab value="integrations">Integrations</Tab>
      </TabList>
      <TabPanel value="general">
        <Text size="sm" color="secondary">General application settings.</Text>
      </TabPanel>
      <TabPanel value="appearance">
        <Text size="sm" color="secondary">Theme and display preferences.</Text>
      </TabPanel>
      <TabPanel value="integrations">
        <Text size="sm" color="secondary">Connected services and APIs.</Text>
      </TabPanel>
    </Tabs>
  ),
};

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Settings page</SectionLabel>
      <div>
        <Text size="lg" weight="semibold" as="h2" style={{ margin: '0 0 12px' }}>Settings</Text>
        <Tabs defaultValue="general">
          <TabList>
            <Tab value="general" icon={<Icon icon={Settings} size="xs" />}>General</Tab>
            <Tab value="profile" icon={<Icon icon={User} size="xs" />}>Profile</Tab>
            <Tab value="notifications" icon={<Icon icon={Bell} size="xs" />}>Notifications</Tab>
          </TabList>
          <TabPanel value="general">
            <Text size="sm" color="secondary">Configure general application settings.</Text>
          </TabPanel>
          <TabPanel value="profile">
            <Text size="sm" color="secondary">Update your public profile information.</Text>
          </TabPanel>
          <TabPanel value="notifications">
            <Text size="sm" color="secondary">Choose what notifications you receive.</Text>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  ),
};
