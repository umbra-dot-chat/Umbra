import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Icon } from '@wisp-ui/react';
import { VStack } from '@wisp-ui/react';
import { User, Globe, Shield, Zap, Palette, Code, Settings, Users } from 'lucide-react';

const meta: Meta<typeof Select> = {
  title: 'React/Components/Data Entry/Select',
  component: Select,
  tags: ['autodocs'],
  args: { size: 'md', placeholder: 'Select…' },
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    error: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'dragonfruit', label: 'Dragonfruit' },
  { value: 'elderberry', label: 'Elderberry' },
];

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
    <Text size="xs" color="tertiary" weight="medium" style={{ width: 60, flexShrink: 0, textAlign: 'right', paddingTop: 10 }}>
      {label}
    </Text>
    {children}
  </div>
);

export const Default: Story = {
  args: { options: fruitOptions },
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Row key={size} label={size}>
          <Select size={size} options={fruitOptions} defaultValue="apple" />
        </Row>
      ))}
    </div>
  ),
};

export const WithLabel: Story = {
  name: 'With Label & Hint',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300 }}>
      <Select label="Fruit" hint="Pick your favorite" options={fruitOptions} fullWidth />
      <Select label="Fruit" error="Selection is required" options={fruitOptions} fullWidth />
    </div>
  ),
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Select options={fruitOptions} disabled defaultValue="cherry" />
      <Select options={fruitOptions} disabled placeholder="Choose…" />
    </div>
  ),
};

export const WithDisabledOptions: Story = {
  name: 'Disabled Options',
  render: () => (
    <Select
      options={[
        { value: 'a', label: 'Available' },
        { value: 'b', label: 'Also available' },
        { value: 'c', label: 'Not available', disabled: true },
        { value: 'd', label: 'Available too' },
      ]}
    />
  ),
};

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Select key={size} skeleton size={size} options={[]} />
      ))}
    </div>
  ),
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState('banana');
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Select value={value} onChange={setValue} options={fruitOptions} />
          <Text size="sm" color="secondary">Selected: {value}</Text>
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// With Icons
// ---------------------------------------------------------------------------

const roleOptions = [
  { value: 'admin', label: 'Admin', icon: <Icon icon={Shield} size="sm" />, description: 'Full access' },
  { value: 'editor', label: 'Editor', icon: <Icon icon={Code} size="sm" />, description: 'Can edit' },
  { value: 'viewer', label: 'Viewer', icon: <Icon icon={Globe} size="sm" />, description: 'Read only' },
  { value: 'guest', label: 'Guest', icon: <Icon icon={User} size="sm" />, description: 'Limited' },
];

export const WithIcons: Story = {
  name: 'With Icons & Descriptions',
  render: () => (
    <VStack gap="xl" style={{ maxWidth: 300 }}>
      <Select
        label="Role"
        hint="Choose a user role"
        options={roleOptions}
        placeholder="Select role…"
        fullWidth
      />
      <Select
        label="Role (pre-selected)"
        options={roleOptions}
        defaultValue="editor"
        fullWidth
      />
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// Team Member (matching Untitled UI pattern)
// ---------------------------------------------------------------------------

const teamMembers = [
  { value: 'phoenix', label: 'Phoenix Baker', icon: <Icon icon={User} size="sm" />, description: '@phoenix' },
  { value: 'olivia', label: 'Olivia Rhye', icon: <Icon icon={User} size="sm" />, description: '@olivia' },
  { value: 'lana', label: 'Lana Steiner', icon: <Icon icon={User} size="sm" />, description: '@lana' },
  { value: 'demi', label: 'Demi Wilkinson', icon: <Icon icon={User} size="sm" />, description: '@demi' },
  { value: 'candice', label: 'Candice Wu', icon: <Icon icon={User} size="sm" />, description: '@candice' },
  { value: 'natali', label: 'Natali Craig', icon: <Icon icon={User} size="sm" />, description: '@natali' },
];

export const TeamMember: Story = {
  name: 'Team Member Select',
  render: () => (
    <Select
      label="Team member"
      placeholder="Select team member"
      options={teamMembers}
      leadingIcon={<Icon icon={Users} size="sm" />}
      fullWidth
      style={{ maxWidth: 340 }}
    />
  ),
};

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------

export const Glass: Story = {
  name: 'Glass',
  render: () => (
    <div style={{ padding: 40, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, display: 'inline-block' }}>
      <Select
        variant="glass"
        label="Fruit"
        placeholder="Select a fruit..."
        options={fruitOptions}
        fullWidth
        style={{ maxWidth: 300 }}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Leading Icon (static)
// ---------------------------------------------------------------------------

export const WithLeadingIcon: Story = {
  name: 'With Leading Icon',
  render: () => (
    <VStack gap="lg" style={{ maxWidth: 300 }}>
      <Select
        label="Category"
        options={[
          { value: 'performance', label: 'Performance', icon: <Icon icon={Zap} size="sm" /> },
          { value: 'design', label: 'Design', icon: <Icon icon={Palette} size="sm" /> },
          { value: 'settings', label: 'Settings', icon: <Icon icon={Settings} size="sm" /> },
        ]}
        leadingIcon={<Icon icon={Settings} size="sm" />}
        placeholder="Choose category…"
        fullWidth
      />
    </VStack>
  ),
};
