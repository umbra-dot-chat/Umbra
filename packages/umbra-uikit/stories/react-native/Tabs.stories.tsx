import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabList, Tab, TabPanel, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Tabs> = {
  title: 'React Native/Components/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Tabs defaultValue="account">
        <TabList>
          <Tab value="account">Account</Tab>
          <Tab value="password">Password</Tab>
        </TabList>
        <TabPanel value="account">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>Manage your account settings and preferences.</Text>
          </div>
        </TabPanel>
        <TabPanel value="password">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>Update your password and security options.</Text>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. MultipleTabs
// ---------------------------------------------------------------------------

export const MultipleTabs: Story = {
  name: 'Multiple Tabs',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <div style={sectionLabel}>Several tabs with content panels</div>
      <Tabs defaultValue="overview">
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="analytics">Analytics</Tab>
          <Tab value="reports">Reports</Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>
        <TabPanel value="overview">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>A high-level summary of your project status and recent activity.</Text>
          </div>
        </TabPanel>
        <TabPanel value="analytics">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>View detailed analytics about user engagement and traffic.</Text>
          </div>
        </TabPanel>
        <TabPanel value="reports">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>Generate and download reports for your team.</Text>
          </div>
        </TabPanel>
        <TabPanel value="settings">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>Configure project-level settings and integrations.</Text>
          </div>
        </TabPanel>
      </Tabs>

      <div style={sectionLabel}>With a disabled tab</div>
      <Tabs defaultValue="general">
        <TabList>
          <Tab value="general">General</Tab>
          <Tab value="billing" disabled>Billing</Tab>
          <Tab value="team">Team</Tab>
        </TabList>
        <TabPanel value="general">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>General settings for your workspace.</Text>
          </div>
        </TabPanel>
        <TabPanel value="billing">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>Billing information is currently unavailable.</Text>
          </div>
        </TabPanel>
        <TabPanel value="team">
          <div style={{ padding: 16 }}>
            <Text style={{ fontSize: 14 }}>Manage your team members and roles.</Text>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [activeTab, setActiveTab] = useState('tab-1');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
        <div style={sectionLabel}>Controlled State</div>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab value="tab-1">First</Tab>
            <Tab value="tab-2">Second</Tab>
            <Tab value="tab-3">Third</Tab>
          </TabList>
          <TabPanel value="tab-1">
            <div style={{ padding: 16 }}>
              <Text style={{ fontSize: 14 }}>Content for the first tab.</Text>
            </div>
          </TabPanel>
          <TabPanel value="tab-2">
            <div style={{ padding: 16 }}>
              <Text style={{ fontSize: 14 }}>Content for the second tab.</Text>
            </div>
          </TabPanel>
          <TabPanel value="tab-3">
            <div style={{ padding: 16 }}>
              <Text style={{ fontSize: 14 }}>Content for the third tab.</Text>
            </div>
          </TabPanel>
        </Tabs>
        <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
          Active tab: &quot;{activeTab}&quot;
        </div>
      </div>
    );
  },
};
