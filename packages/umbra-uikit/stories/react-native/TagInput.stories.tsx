import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TagInput, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof TagInput> = {
  title: 'React Native/Primitives/TagInput',
  component: TagInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    allowDuplicates: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TagInput>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    placeholder: 'Add a tag...',
    label: 'Tags',
    hint: 'Press comma or enter to add a tag',
    size: 'md',
  },
};

// ---------------------------------------------------------------------------
// 2. With Initial Tags
// ---------------------------------------------------------------------------

export const WithInitialTags: Story = {
  name: 'With Initial Tags',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Default values</div>
        <TagInput
          label="Skills"
          defaultValue={['React', 'TypeScript', 'Node.js']}
          placeholder="Add skill..."
        />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>With hint</div>
        <TagInput
          label="Interests"
          defaultValue={['Design', 'Music']}
          hint="Add your interests to personalise your feed"
          placeholder="Add interest..."
        />
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <TagInput
        label="Disabled empty"
        disabled
        placeholder="Cannot add tags"
      />
      <TagInput
        label="Disabled with tags"
        disabled
        defaultValue={['Locked', 'Read-only']}
        placeholder="Cannot add tags"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Max Tags
// ---------------------------------------------------------------------------

export const MaxTags: Story = {
  name: 'Max Tags',
  render: () => {
    const MaxTagsExample = () => {
      const [tags, setTags] = useState(['React', 'Vue']);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Max 3 tags</div>
            <TagInput
              label="Frameworks"
              value={tags}
              onChange={setTags}
              max={3}
              placeholder={tags.length < 3 ? 'Add framework...' : ''}
              hint={`${tags.length} / 3 tags`}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Max 5 tags (uncontrolled)</div>
            <TagInput
              label="Topics"
              defaultValue={['AI', 'ML', 'NLP']}
              max={5}
              placeholder="Add topic..."
              hint="Maximum 5 topics allowed"
            />
          </div>
        </div>
      );
    };
    return <MaxTagsExample />;
  },
};
