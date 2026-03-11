import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { breadcrumbSizes } from '@coexist/wisp-core/types/Breadcrumb.types';
import { Text } from '../../primitives/text';
import { Icon } from '../../primitives/icon';
import { Home, Folder, File } from 'lucide-react';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Layouts/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...breadcrumbSizes] },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

export const Default: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem href="#">Home</BreadcrumbItem>
      <BreadcrumbItem href="#">Projects</BreadcrumbItem>
      <BreadcrumbItem active>Dashboard</BreadcrumbItem>
    </Breadcrumb>
  ),
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {breadcrumbSizes.map((size) => (
        <div key={size}>
          <SectionLabel>{size}</SectionLabel>
          <Breadcrumb size={size}>
            <BreadcrumbItem href="#">Home</BreadcrumbItem>
            <BreadcrumbItem href="#">Projects</BreadcrumbItem>
            <BreadcrumbItem active>Settings</BreadcrumbItem>
          </Breadcrumb>
        </div>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <Breadcrumb size="md">
      <BreadcrumbItem href="#" icon={<Icon icon={Home} size="xs" />}>Home</BreadcrumbItem>
      <BreadcrumbItem href="#" icon={<Icon icon={Folder} size="xs" />}>Documents</BreadcrumbItem>
      <BreadcrumbItem active icon={<Icon icon={File} size="xs" />}>Report.pdf</BreadcrumbItem>
    </Breadcrumb>
  ),
};

export const CustomSeparator: Story = {
  name: 'Custom Separator',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Slash separator</SectionLabel>
      <Breadcrumb separator="/">
        <BreadcrumbItem href="#">Home</BreadcrumbItem>
        <BreadcrumbItem href="#">Library</BreadcrumbItem>
        <BreadcrumbItem active>Data</BreadcrumbItem>
      </Breadcrumb>

      <SectionLabel>Dot separator</SectionLabel>
      <Breadcrumb separator="·">
        <BreadcrumbItem href="#">Home</BreadcrumbItem>
        <BreadcrumbItem href="#">Products</BreadcrumbItem>
        <BreadcrumbItem active>Details</BreadcrumbItem>
      </Breadcrumb>
    </div>
  ),
};

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Page header with breadcrumb</SectionLabel>
      <div>
        <Breadcrumb size="sm">
          <BreadcrumbItem href="#">Dashboard</BreadcrumbItem>
          <BreadcrumbItem href="#">Users</BreadcrumbItem>
          <BreadcrumbItem active>John Doe</BreadcrumbItem>
        </Breadcrumb>
        <Text size="display-xs" weight="semibold" as="h1" style={{ marginTop: 8 }}>
          User Profile
        </Text>
        <Text size="sm" color="secondary">
          Manage user details and permissions.
        </Text>
      </div>
    </div>
  ),
};
