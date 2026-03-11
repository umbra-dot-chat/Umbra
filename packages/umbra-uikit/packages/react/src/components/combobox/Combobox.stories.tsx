import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Combobox } from './Combobox';
import { Text } from '../../primitives/text';
import { Button } from '../../primitives/button';
import { VStack } from '../../layouts/stack';
import { Icon } from '../../primitives/icon';
import { User, Globe, Shield, Code, Users, Zap, Palette, Settings } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Combobox> = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    skeleton: false,
    fullWidth: false,
    placeholder: 'Select an option...',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

// ---------------------------------------------------------------------------
// Sample options
// ---------------------------------------------------------------------------

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
];

const countries = Array.from({ length: 50 }, (_, i) => ({
  value: `country-${i}`,
  label: [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola',
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus',
    'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
    'Bosnia', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
    'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
    'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
    'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
    'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
  ][i],
}));

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <Combobox {...args} options={fruits} />,
};

// ---------------------------------------------------------------------------
// 2. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Combobox
        label="Favorite Fruit"
        placeholder="Search fruits..."
        options={fruits}
        hint="Start typing to filter options."
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Error
// ---------------------------------------------------------------------------

export const WithError: Story = {
  name: 'With Error',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Combobox
        label="Fruit"
        placeholder="Select a fruit..."
        options={fruits}
        error="Please select a valid fruit."
        size="md"
      />
      <Combobox
        placeholder="Boolean error (red border only)"
        options={fruits}
        error={true}
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Many Options
// ---------------------------------------------------------------------------

export const ManyOptions: Story = {
  name: 'Many Options',
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Combobox
        label="Country"
        placeholder="Search countries..."
        options={countries}
        size="md"
        fullWidth
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Empty State
// ---------------------------------------------------------------------------

export const EmptyState: Story = {
  name: 'Empty State',
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Combobox
        label="Empty List"
        placeholder="Type anything..."
        options={[]}
        emptyMessage="No options available"
        size="md"
        fullWidth
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Combobox
        label="Disabled combobox"
        placeholder="Cannot interact"
        options={fruits}
        disabled
        size="md"
      />
      <Combobox
        placeholder="Disabled with value"
        options={fruits}
        value="apple"
        disabled
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Combobox key={size} skeleton size={size} options={[]} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Composition -- Form with multiple Comboboxes
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const FormExample = () => {
      const [fruit, setFruit] = useState('');
      const [country, setCountry] = useState('');
      const [submitted, setSubmitted] = useState(false);

      const fruitError = submitted && !fruit ? 'Please select a fruit.' : undefined;
      const countryError = submitted && !country ? 'Please select a country.' : undefined;

      return (
        <div style={{ maxWidth: 400 }}>
          <Text size="lg" weight="semibold" style={{ marginBottom: 4 }}>
            Preferences
          </Text>
          <Text size="sm" color="secondary" style={{ marginBottom: 20 }}>
            Tell us about your preferences.
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Combobox
              fullWidth
              label="Favorite Fruit"
              placeholder="Search fruits..."
              options={fruits}
              value={fruit}
              onChange={setFruit}
              error={fruitError}
              size="md"
            />

            <Combobox
              fullWidth
              label="Country"
              placeholder="Search countries..."
              options={countries}
              value={country}
              onChange={setCountry}
              error={countryError}
              size="md"
            />

            <Button
              fullWidth
              variant="primary"
              size="lg"
              onClick={() => setSubmitted(true)}
              style={{ marginTop: 4 }}
            >
              Submit
            </Button>
          </div>
        </div>
      );
    };

    return <FormExample />;
  },
};

// ---------------------------------------------------------------------------
// 9. With Icons & Descriptions
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
    <VStack gap="xl" style={{ maxWidth: 340 }}>
      <Combobox
        label="Role"
        hint="Search and choose a role"
        options={roleOptions}
        placeholder="Search roles…"
        fullWidth
      />
      <Combobox
        label="Role (pre-selected)"
        options={roleOptions}
        defaultValue="editor"
        fullWidth
      />
    </VStack>
  ),
};

// ---------------------------------------------------------------------------
// 10. Team Member Search (Untitled UI pattern)
// ---------------------------------------------------------------------------

const teamMembers = [
  { value: 'phoenix', label: 'Phoenix Baker', icon: <Icon icon={User} size="sm" />, description: '@phoenix' },
  { value: 'olivia', label: 'Olivia Rhye', icon: <Icon icon={User} size="sm" />, description: '@olivia' },
  { value: 'lana', label: 'Lana Steiner', icon: <Icon icon={User} size="sm" />, description: '@lana' },
  { value: 'demi', label: 'Demi Wilkinson', icon: <Icon icon={User} size="sm" />, description: '@demi' },
  { value: 'candice', label: 'Candice Wu', icon: <Icon icon={User} size="sm" />, description: '@candice' },
  { value: 'natali', label: 'Natali Craig', icon: <Icon icon={User} size="sm" />, description: '@natali' },
];

// ---------------------------------------------------------------------------
// 11. Glass
// ---------------------------------------------------------------------------

export const Glass: Story = {
  name: 'Glass',
  render: () => (
    <div style={{ padding: 40, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, display: 'inline-block' }}>
      <Combobox
        variant="glass"
        label="Fruit"
        placeholder="Search fruits..."
        options={fruits}
        fullWidth
        style={{ maxWidth: 320 }}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 12. Team Member Search (Untitled UI pattern)
// ---------------------------------------------------------------------------

export const TeamMemberSearch: Story = {
  name: 'Team Member Search',
  render: () => (
    <Combobox
      label="Team member"
      placeholder="Search team members…"
      options={teamMembers}
      leadingIcon={<Icon icon={Users} size="sm" />}
      fullWidth
      style={{ maxWidth: 340 }}
    />
  ),
};
