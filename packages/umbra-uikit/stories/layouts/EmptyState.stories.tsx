import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '@wisp-ui/react';
import { emptyStateSizes } from '@wisp-ui/react';
import { Icon } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { useThemeColors } from '@wisp-ui/react';
import { Inbox, Search, FileText, Upload } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'React/Layouts/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...emptyStateSizes] },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <EmptyState
      icon={<Icon icon={Inbox} size="xl" />}
      title="No messages"
      description="Your inbox is empty. New messages will appear here."
    />
  ),
};

// ---------------------------------------------------------------------------
// With Action
// ---------------------------------------------------------------------------

export const WithAction: Story = {
  name: 'With Action',
  render: () => (
    <EmptyState
      icon={<Icon icon={FileText} size="xl" />}
      title="No documents"
      description="Get started by creating your first document."
      action={<Button size="sm">Create Document</Button>}
    />
  ),
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const Demo = () => {
      const themeColors = useThemeColors();
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {emptyStateSizes.map((s) => (
            <div key={s}>
              <Text size="xs" color="secondary" style={{ marginBottom: 8 }}>
                size="{s}"
              </Text>
              <div
                style={{
                  border: `1px solid ${themeColors.border.subtle}`,
                  borderRadius: 12,
                }}
              >
                <EmptyState
                  size={s}
                  icon={<Icon icon={Inbox} size={s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'xl'} />}
                  title="No items found"
                  description="Try adjusting your search or filters."
                />
              </div>
            </div>
          ))}
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Search Results
// ---------------------------------------------------------------------------

export const SearchResults: Story = {
  name: 'Search Results',
  render: () => (
    <EmptyState
      icon={<Icon icon={Search} size="xl" />}
      title="No results found"
      description="Try adjusting your search terms or removing filters to see more results."
      action={<Button variant="secondary" size="sm">Clear Filters</Button>}
    />
  ),
};

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export const UploadArea: Story = {
  name: 'Upload Area',
  render: () => {
    const Demo = () => {
      const themeColors = useThemeColors();
      return (
        <div
          style={{
            border: `2px dashed ${themeColors.border.strong}`,
            borderRadius: 12,
          }}
        >
          <EmptyState
            icon={<Icon icon={Upload} size="xl" />}
            title="Drop files here"
            description="Or click to browse your computer. Supports PNG, JPG, and PDF up to 10 MB."
            action={<Button variant="secondary" size="sm">Browse Files</Button>}
          />
        </div>
      );
    };
    return <Demo />;
  },
};
