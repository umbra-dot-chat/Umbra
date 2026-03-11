import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TagInput } from './TagInput';
import { Text } from '../text';
import { Button } from '../button';
import { Search, Users, Tag, Mail } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TagInput> = {
  title: 'Primitives/TagInput',
  component: TagInput,
  tags: ['autodocs'],
  args: {
    size: 'md',
    disabled: false,
    skeleton: false,
    fullWidth: false,
    placeholder: 'Add a tag...',
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
type Story = StoryObj<typeof TagInput>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
    <Text size="xs" color="tertiary" weight="medium" style={{ width: 100, flexShrink: 0, textAlign: 'right', paddingTop: 8 }}>
      {label}
    </Text>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default / Playground
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: (args) => <TagInput {...args} />,
};

// ---------------------------------------------------------------------------
// 2. Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Row key={size} label={size}>
          <TagInput size={size} placeholder={`Size ${size}`} defaultValue={['React', 'TypeScript']} />
        </Row>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Label
// ---------------------------------------------------------------------------

export const WithLabel: Story = {
  name: 'With Label',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TagInput label="Skills" placeholder="Add a skill..." size="md" defaultValue={['React', 'Node.js']} />
      <TagInput label="Categories" placeholder="Add a category..." size="md" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Hint
// ---------------------------------------------------------------------------

export const WithHint: Story = {
  name: 'With Hint',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TagInput
        label="Tags"
        placeholder="Type and press Enter..."
        hint="Press Enter or comma to add a tag. Backspace to remove."
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. With Icon
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TagInput
        icon={Tag}
        label="Tags"
        placeholder="Add tags..."
        defaultValue={['Design', 'UI']}
        size="md"
      />
      <TagInput
        icon={Search}
        placeholder="Search and add..."
        size="md"
      />
      <TagInput
        icon={Mail}
        label="Recipients"
        placeholder="Add email..."
        defaultValue={['alice@example.com', 'bob@example.com']}
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Error & Warning
// ---------------------------------------------------------------------------

export const ErrorState: Story = {
  name: 'Error & Warning',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TagInput
        label="Skills"
        placeholder="Add a skill..."
        error="At least one skill is required."
        size="md"
      />
      <TagInput
        label="Tags"
        placeholder="Add a tag..."
        warning="You have many tags. Consider removing some."
        defaultValue={['React', 'Vue', 'Angular', 'Svelte', 'Solid']}
        size="md"
      />
      <TagInput
        placeholder="Boolean error (red border only)"
        error={true}
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Max Tags
// ---------------------------------------------------------------------------

export const MaxTags: Story = {
  name: 'Max Tags',
  render: () => {
    const MaxDemo = () => {
      const [tags, setTags] = useState(['React', 'TypeScript', 'Vite']);
      return (
        <div style={{ maxWidth: 400 }}>
          <TagInput
            label="Technologies (max 5)"
            placeholder={tags.length < 5 ? 'Add up to 5...' : ''}
            value={tags}
            onChange={setTags}
            max={5}
            hint={`${tags.length} / 5 tags`}
            size="md"
          />
        </div>
      );
    };
    return <MaxDemo />;
  },
};

// ---------------------------------------------------------------------------
// 8. No Duplicates
// ---------------------------------------------------------------------------

export const NoDuplicates: Story = {
  name: 'No Duplicates',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <TagInput
        label="Unique tags only"
        placeholder="Try adding 'React' twice..."
        defaultValue={['React']}
        allowDuplicates={false}
        hint="Duplicate tags are silently rejected."
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Custom Separators
// ---------------------------------------------------------------------------

export const CustomSeparators: Story = {
  name: 'Custom Separators',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TagInput
        label="Comma separated (default)"
        placeholder="Type and use comma..."
        separators={[',']}
        size="md"
      />
      <TagInput
        label="Semicolon separated"
        placeholder="Type and use semicolon..."
        separators={[';']}
        hint="Tags are split by semicolons."
        size="md"
      />
      <TagInput
        label="Space, comma, or semicolon"
        placeholder="Multiple separators..."
        separators={[',', ';', ' ']}
        hint="Any of: comma, semicolon, or space."
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 10. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <TagInput
        label="Disabled with tags"
        defaultValue={['React', 'TypeScript', 'Vite']}
        disabled
        size="md"
      />
      <TagInput
        label="Disabled empty"
        placeholder="Cannot type here"
        disabled
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 11. Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <TagInput key={size} skeleton size={size} />
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 12. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      <TagInput
        fullWidth
        label="Full width"
        placeholder="Stretches to container..."
        defaultValue={['React', 'Vue', 'Angular']}
        size="md"
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 13. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const ControlledDemo = () => {
      const [tags, setTags] = useState<string[]>(['Phoenix Baker', 'Lana Steiner']);

      return (
        <div style={{ maxWidth: 400 }}>
          <TagInput
            icon={Users}
            label="Team members"
            placeholder="Add a member..."
            value={tags}
            onChange={setTags}
            onTagAdd={(tag) => console.log('Added:', tag)}
            onTagRemove={(tag) => console.log('Removed:', tag)}
            size="md"
          />
          <Text size="xs" color="tertiary" style={{ marginTop: 8 }}>
            Current: {tags.join(', ') || '(none)'}
          </Text>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

// ---------------------------------------------------------------------------
// 14. Composition — Email Recipients
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const EmailForm = () => {
      const [to, setTo] = useState<string[]>(['alice@acme.com']);
      const [cc, setCc] = useState<string[]>([]);
      const [submitted, setSubmitted] = useState(false);

      const toError = submitted && to.length === 0 ? 'At least one recipient is required.' : undefined;

      return (
        <div style={{ maxWidth: 480 }}>
          <Text size="lg" weight="semibold" style={{ marginBottom: 4 }}>
            New Message
          </Text>
          <Text size="sm" color="secondary" style={{ marginBottom: 20 }}>
            Compose and send an email.
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TagInput
              fullWidth
              icon={Mail}
              label="To"
              placeholder="Add recipients..."
              value={to}
              onChange={setTo}
              error={toError}
              size="md"
            />

            <TagInput
              fullWidth
              icon={Mail}
              label="Cc"
              placeholder="Add cc..."
              value={cc}
              onChange={setCc}
              size="md"
            />

            <Button
              fullWidth
              variant="primary"
              size="lg"
              onClick={() => setSubmitted(true)}
              style={{ marginTop: 4 }}
            >
              Send
            </Button>
          </div>
        </div>
      );
    };

    return <EmailForm />;
  },
};

// ---------------------------------------------------------------------------
// 15. Paste Support
// ---------------------------------------------------------------------------

export const PasteSupport: Story = {
  name: 'Paste Support',
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <TagInput
        label="Paste comma-separated values"
        placeholder="Try pasting: React, Vue, Angular"
        hint="Paste a comma-separated list to add multiple tags at once."
        size="md"
      />
    </div>
  ),
};
