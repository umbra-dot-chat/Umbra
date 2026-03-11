import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AdvancedSearchPanel } from './AdvancedSearchPanel';
import type { AdvancedSearchFilters } from '@coexist/wisp-core/types/AdvancedSearchPanel.types';

const meta: Meta<typeof AdvancedSearchPanel> = {
  title: 'Components/Community/AdvancedSearchPanel',
  component: AdvancedSearchPanel,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    resultCount: { control: 'number' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof AdvancedSearchPanel>;

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [filters, setFilters] = useState<AdvancedSearchFilters>({});
      return (
        <AdvancedSearchPanel
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={() => console.log('Search:', filters)}
          onReset={() => setFilters({})}
          channels={[
            { id: '1', name: 'general' },
            { id: '2', name: 'random' },
            { id: '3', name: 'dev' },
          ]}
          users={[
            { id: 'u1', name: 'Alice' },
            { id: 'u2', name: 'Bob' },
          ]}
          resultCount={42}
        />
      );
    };
    return <Demo />;
  },
};

export const Loading: Story = {
  name: 'Loading',
  render: () => {
    const Demo = () => {
      const [filters, setFilters] = useState<AdvancedSearchFilters>({
        query: 'hello world',
      });
      return (
        <AdvancedSearchPanel
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={() => {}}
          onReset={() => setFilters({})}
          loading
        />
      );
    };
    return <Demo />;
  },
};

export const WithResults: Story = {
  name: 'With Results',
  render: () => {
    const Demo = () => {
      const [filters, setFilters] = useState<AdvancedSearchFilters>({
        query: 'deployment',
        fromUser: 'alice',
        hasFile: true,
      });
      return (
        <AdvancedSearchPanel
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={() => {}}
          onReset={() => setFilters({})}
          resultCount={7}
        />
      );
    };
    return <Demo />;
  },
};
