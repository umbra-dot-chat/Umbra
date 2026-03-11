import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Combobox, Text } from '@wisp-ui/react-native';

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
  { value: 'au', label: 'Australia' },
];

const meta: Meta<typeof Combobox> = {
  title: 'React Native/Components/Data Entry/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    options: countryOptions,
    label: 'Country',
    defaultValue: 'us',
  },
};

// ---------------------------------------------------------------------------
// 2. With Placeholder
// ---------------------------------------------------------------------------

export const WithPlaceholder: Story = {
  name: 'With Placeholder',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Custom placeholder</div>
      <Combobox
        options={countryOptions}
        placeholder="Search countries..."
        label="Country"
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>With descriptions</div>
      <Combobox
        options={[
          { value: 'react', label: 'React', description: 'A JavaScript library for building UIs' },
          { value: 'vue', label: 'Vue', description: 'The progressive JavaScript framework' },
          { value: 'angular', label: 'Angular', description: 'Platform for building mobile and desktop apps' },
          { value: 'svelte', label: 'Svelte', description: 'Cybernetically enhanced web apps' },
        ]}
        placeholder="Choose a framework..."
        label="Framework"
      />
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>With error</div>
      <Combobox
        options={countryOptions}
        placeholder="Select a country..."
        label="Country"
        error="Please select a country"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Filterable
// ---------------------------------------------------------------------------

export const Filterable: Story = {
  name: 'Filterable',
  render: () => {
    const FilterableCombobox = () => {
      const [value, setValue] = useState('');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Search and filter options</div>
          <Combobox
            options={[
              { value: 'apple', label: 'Apple' },
              { value: 'apricot', label: 'Apricot' },
              { value: 'avocado', label: 'Avocado' },
              { value: 'banana', label: 'Banana' },
              { value: 'blueberry', label: 'Blueberry' },
              { value: 'cherry', label: 'Cherry' },
              { value: 'cranberry', label: 'Cranberry' },
              { value: 'grape', label: 'Grape' },
              { value: 'grapefruit', label: 'Grapefruit' },
              { value: 'kiwi', label: 'Kiwi' },
              { value: 'lemon', label: 'Lemon' },
              { value: 'mango', label: 'Mango' },
              { value: 'orange', label: 'Orange' },
              { value: 'peach', label: 'Peach' },
              { value: 'pear', label: 'Pear' },
              { value: 'strawberry', label: 'Strawberry' },
            ]}
            value={value}
            onChange={setValue}
            placeholder="Type to search fruits..."
            label="Fruit"
            emptyMessage="No matching fruits"
          />
          <Text size="sm" color="secondary">
            {value ? `Selected: ${value}` : 'Open the dropdown and type to filter'}
          </Text>
          <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Disabled</div>
          <Combobox
            options={countryOptions}
            defaultValue="gb"
            label="Country"
            disabled
          />
        </div>
      );
    };
    return <FilterableCombobox />;
  },
};
