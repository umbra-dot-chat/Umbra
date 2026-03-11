import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Breadcrumb> = {
  title: 'React Native/Layouts/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Basic breadcrumb with default chevron separator
      </div>
      <Breadcrumb>
        <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
        <BreadcrumbItem onPress={() => {}}>Products</BreadcrumbItem>
        <BreadcrumbItem active>Details</BreadcrumbItem>
      </Breadcrumb>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. With Separator
// ---------------------------------------------------------------------------

export const WithSeparator: Story = {
  name: 'With Separator',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Custom text separator via prop
        </div>
        <Breadcrumb separator={<Text>/</Text>}>
          <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => {}}>Settings</BreadcrumbItem>
          <BreadcrumbItem active>Profile</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          BreadcrumbSeparator component (inline)
        </div>
        <Breadcrumb>
          <BreadcrumbItem onPress={() => {}}>Dashboard</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem onPress={() => {}}>Users</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem active>Edit</BreadcrumbItem>
        </Breadcrumb>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Multi-Level
// ---------------------------------------------------------------------------

export const MultiLevel: Story = {
  name: 'Multi-Level',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Deep navigation path
        </div>
        <Breadcrumb>
          <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => {}}>Electronics</BreadcrumbItem>
          <BreadcrumbItem onPress={() => {}}>Computers</BreadcrumbItem>
          <BreadcrumbItem onPress={() => {}}>Laptops</BreadcrumbItem>
          <BreadcrumbItem active>MacBook Pro</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Two levels only
        </div>
        <Breadcrumb>
          <BreadcrumbItem onPress={() => {}}>Blog</BreadcrumbItem>
          <BreadcrumbItem active>Post Title</BreadcrumbItem>
        </Breadcrumb>
      </div>
    </div>
  ),
};
