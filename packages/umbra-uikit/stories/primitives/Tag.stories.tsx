import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Hash, Star, X, Tag as TagIcon, Zap, Circle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Tag> = {
  title: 'React/Primitives/Tag',
  component: Tag,
  tags: ['autodocs'],
  args: {
    children: 'Label',
    size: 'md',
    disabled: false,
    selected: false,
    skeleton: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
    <Text size="xs" color="tertiary" weight="medium" style={{ width: 100, flexShrink: 0, textAlign: 'right' }}>
      {label}
    </Text>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <Tag {...args} />,
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Row key={size} label={size}>
          <Tag size={size}>Default</Tag>
          <Tag size={size} selected>Selected</Tag>
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Remove Button
// ---------------------------------------------------------------------------

export const WithRemove: Story = {
  name: 'With Remove',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Row key={size} label={size}>
          <Tag size={size} onRemove={() => console.log('remove')}>Removable</Tag>
          <Tag size={size} onRemove={() => console.log('remove')} selected>Selected</Tag>
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Selected State
// ---------------------------------------------------------------------------

export const Selected: Story = {
  name: 'Selected',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Tag>Default</Tag>
      <Tag selected>Selected</Tag>
      <Tag selected onRemove={() => {}}>Selected + Remove</Tag>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Icon
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Row label="Hash">
        <Tag icon={Hash} size="sm">channel</Tag>
        <Tag icon={Hash} size="md">channel</Tag>
        <Tag icon={Hash} size="lg">channel</Tag>
      </Row>
      <Row label="Star">
        <Tag icon={Star} size="sm" selected>favorite</Tag>
        <Tag icon={Star} size="md" selected>favorite</Tag>
        <Tag icon={Star} size="lg" selected>favorite</Tag>
      </Row>
      <Row label="Icon + Remove">
        <Tag icon={TagIcon} onRemove={() => {}}>removable</Tag>
        <Tag icon={Zap} onRemove={() => {}} selected>selected</Tag>
      </Row>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Tag disabled>Default</Tag>
      <Tag disabled selected>Selected</Tag>
      <Tag disabled onRemove={() => {}}>With Remove</Tag>
      <Tag disabled icon={Hash}>With Icon</Tag>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Tag key={size} size={size} skeleton>placeholder</Tag>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Interactive (click to select/deselect)
// ---------------------------------------------------------------------------

export const Interactive: Story = {
  name: 'Interactive',
  render: () => {
    const InteractiveDemo = () => {
      const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(['react']));

      const tags = ['react', 'typescript', 'vitest', 'storybook', 'wisp'];

      const toggleTag = (tag: string) => {
        setSelectedTags((prev) => {
          const next = new Set(prev);
          if (next.has(tag)) {
            next.delete(tag);
          } else {
            next.add(tag);
          }
          return next;
        });
      };

      return (
        <div>
          <Text size="xs" color="tertiary" weight="medium" style={{ marginBottom: 8 }}>
            Click to select / deselect
          </Text>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Tag
                key={tag}
                selected={selectedTags.has(tag)}
                onClick={() => toggleTag(tag)}
                icon={Circle}
              >
                {tag}
              </Tag>
            ))}
          </div>
          <Text size="xs" color="secondary" style={{ marginTop: 12 }}>
            Selected: {selectedTags.size > 0 ? Array.from(selectedTags).join(', ') : 'none'}
          </Text>
        </div>
      );
    };
    return <InteractiveDemo />;
  },
};

// ---------------------------------------------------------------------------
// 9. Tag List (removable list with state)
// ---------------------------------------------------------------------------

export const TagList: Story = {
  name: 'Tag List',
  render: () => {
    const TagListDemo = () => {
      const [tags, setTags] = useState([
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'GraphQL',
        'Rust',
      ]);

      const removeTag = (tag: string) => {
        setTags((prev) => prev.filter((t) => t !== tag));
      };

      return (
        <div>
          <Text size="xs" color="tertiary" weight="medium" style={{ marginBottom: 8 }}>
            Click X to remove tags
          </Text>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Tag key={tag} onRemove={() => removeTag(tag)} icon={Hash}>
                {tag}
              </Tag>
            ))}
          </div>
          {tags.length === 0 && (
            <Text size="sm" color="tertiary" style={{ marginTop: 12 }}>
              All tags removed. Refresh to reset.
            </Text>
          )}
        </div>
      );
    };
    return <TagListDemo />;
  },
};
