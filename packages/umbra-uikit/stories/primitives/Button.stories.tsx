import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@wisp-ui/react';
import { buttonVariants, buttonShapes } from '@wisp-ui/react';
import { componentSizes } from '@wisp-ui/react';
import { Icon } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Plus, ArrowRight, Trash2, Download, Check, Search, Star, Settings, Mail, Heart } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Button> = {
  title: 'React/Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...buttonVariants] },
    size: { control: 'select', options: [...componentSizes] },
    shape: { control: 'select', options: [...buttonShapes] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Variants — all 9 appearance variants
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionLabel>Monochrome (base)</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
      </div>

      <SectionLabel>Destructive</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="destructive">Delete</Button>
        <Button variant="destructive-outline">Delete</Button>
      </div>

      <SectionLabel>Success</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="success">Confirm</Button>
        <Button variant="success-outline">Confirm</Button>
      </div>

      <SectionLabel>Warning</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="warning">Caution</Button>
        <Button variant="warning-outline">Caution</Button>
      </div>

      <SectionLabel>Ghost (tinted bg + bright text)</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="destructive-ghost" iconLeft={<Icon icon={Trash2} size="sm" color="currentColor" />}>Delete</Button>
        <Button variant="success-ghost" iconLeft={<Icon icon={Check} size="sm" color="currentColor" />}>Approve</Button>
        <Button variant="warning-ghost" iconLeft={<Icon icon={Star} size="sm" color="currentColor" />}>Review</Button>
        <Button variant="info-ghost" iconLeft={<Icon icon={Search} size="sm" color="currentColor" />}>Details</Button>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Sizes — all 5 sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>All sizes (primary)</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Button size={size} variant="primary">Button</Button>
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>All sizes (secondary)</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Button size={size} variant="secondary">Button</Button>
            <Text size="xs" color="tertiary">{size}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Shapes — rounded, pill, square
// ---------------------------------------------------------------------------

export const Shapes: Story = {
  name: 'Shapes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Shape variants</SectionLabel>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {(['rounded', 'pill', 'square'] as const).map((shape) => (
          <div key={shape} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Button shape={shape} variant="primary" size="md">Button</Button>
            <Text size="xs" color="tertiary">{shape}</Text>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Shapes across variants</SectionLabel>
      {(['rounded', 'pill', 'square'] as const).map((shape) => (
        <div key={shape} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text size="xs" color="tertiary" style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>{shape}</Text>
          <Button shape={shape} variant="primary" size="sm">Primary</Button>
          <Button shape={shape} variant="secondary" size="sm">Secondary</Button>
          <Button shape={shape} variant="destructive" size="sm">Destructive</Button>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Icons — using Icon primitive
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionLabel>Icon Left</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button iconLeft={<Icon icon={Plus} size="sm" color="currentColor" />}>Add item</Button>
        <Button variant="secondary" iconLeft={<Icon icon={Download} size="sm" color="currentColor" />}>Download</Button>
        <Button variant="destructive" iconLeft={<Icon icon={Trash2} size="sm" color="currentColor" />}>Delete</Button>
        <Button variant="success" iconLeft={<Icon icon={Check} size="sm" color="currentColor" />}>Approve</Button>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Icon Right</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button iconRight={<Icon icon={ArrowRight} size="sm" color="currentColor" />}>Continue</Button>
        <Button variant="secondary" iconRight={<Icon icon={ArrowRight} size="sm" color="currentColor" />}>Next</Button>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Both Icons</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button iconLeft={<Icon icon={Star} size="sm" color="currentColor" />} iconRight={<Icon icon={ArrowRight} size="sm" color="currentColor" />}>
          Featured
        </Button>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Icon-Only — auto-detects when no children
// ---------------------------------------------------------------------------

export const IconOnly: Story = {
  name: 'Icon Only',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Icon-only buttons</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button iconLeft={<Icon icon={Plus} size="sm" color="currentColor" />} variant="primary" size="sm" />
        <Button iconLeft={<Icon icon={Search} size="sm" color="currentColor" />} variant="secondary" size="sm" />
        <Button iconLeft={<Icon icon={Settings} size="sm" color="currentColor" />} variant="tertiary" size="sm" />
        <Button iconLeft={<Icon icon={Trash2} size="sm" color="currentColor" />} variant="destructive" size="sm" />
        <Button iconLeft={<Icon icon={Heart} size="sm" color="currentColor" />} variant="destructive-outline" size="sm" />
      </div>

      <SectionLabel>Icon-only across sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Button iconLeft={<Icon icon={Plus} size={s === 'xs' ? 'xs' : s === 'sm' || s === 'md' ? 'sm' : 'md'} color="currentColor" />} variant="primary" size={s} />
            <Text size="xs" color="tertiary">{s}</Text>
          </div>
        ))}
      </div>

      <SectionLabel>Icon-only shapes</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {(['rounded', 'pill', 'square'] as const).map((shape) => (
          <div key={shape} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Button iconLeft={<Icon icon={Plus} size="sm" color="currentColor" />} variant="primary" shape={shape} />
            <Text size="xs" color="tertiary">{shape}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Loading state
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionLabel>Loading with text</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button isLoading variant="primary">Saving...</Button>
        <Button isLoading variant="secondary">Loading</Button>
        <Button isLoading variant="destructive">Deleting</Button>
        <Button isLoading variant="success">Confirming</Button>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Loading icon-only</SectionLabel>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button isLoading variant="primary" iconLeft={<Icon icon={Plus} size="sm" color="currentColor" />} />
        <Button isLoading variant="secondary" iconLeft={<Icon icon={Search} size="sm" color="currentColor" />} />
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Normal vs Loading comparison</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button variant="primary" iconLeft={<Icon icon={Download} size="sm" color="currentColor" />}>Download</Button>
        <Button variant="primary" isLoading iconLeft={<Icon icon={Download} size="sm" color="currentColor" />}>Downloading...</Button>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Disabled state
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionLabel>Disabled across variants</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button disabled variant="primary">Primary</Button>
        <Button disabled variant="secondary">Secondary</Button>
        <Button disabled variant="tertiary">Tertiary</Button>
        <Button disabled variant="destructive">Destructive</Button>
        <Button disabled variant="success">Success</Button>
        <Button disabled variant="warning">Warning</Button>
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Disabled with icons</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button disabled iconLeft={<Icon icon={Download} size="sm" color="currentColor" />}>Download</Button>
        <Button disabled variant="secondary" iconLeft={<Icon icon={Plus} size="sm" color="currentColor" />}>Add item</Button>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Full Width
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  name: 'Full Width',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
      <SectionLabel>Full-width buttons</SectionLabel>
      <Button fullWidth variant="primary" size="lg">Sign In</Button>
      <Button fullWidth variant="secondary" size="lg">Create Account</Button>
      <Button fullWidth variant="tertiary" size="md">Forgot Password?</Button>

      <div style={{ height: 8 }} />
      <SectionLabel>Full-width with icons</SectionLabel>
      <Button fullWidth variant="primary" size="lg" iconLeft={<Icon icon={Mail} size="md" color="currentColor" />}>
        Continue with Email
      </Button>
      <Button fullWidth variant="secondary" size="lg" iconRight={<Icon icon={ArrowRight} size="md" color="currentColor" />}>
        View Dashboard
      </Button>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. Skeleton Loading
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Skeleton at different sizes</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Button key={size} skeleton size={size} />
        ))}
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Skeleton shapes</SectionLabel>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button skeleton shape="rounded" />
        <Button skeleton shape="pill" />
        <Button skeleton shape="square" />
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Skeleton full-width</SectionLabel>
      <div style={{ maxWidth: 300 }}>
        <Button skeleton fullWidth size="lg" />
      </div>

      <div style={{ height: 8 }} />
      <SectionLabel>Skeleton vs loaded</SectionLabel>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text size="xs" color="tertiary" weight="medium">Loading</Text>
          <Button skeleton size="md" />
          <Button skeleton size="md" />
          <Button skeleton size="sm" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text size="xs" color="tertiary" weight="medium">Loaded</Text>
          <Button variant="primary" size="md">Save Changes</Button>
          <Button variant="secondary" size="md">Cancel</Button>
          <Button variant="tertiary" size="sm">Reset</Button>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 10. Composition — real-world patterns
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <SectionLabel>Dialog actions</SectionLabel>
      <div style={{
        backgroundColor: '#161A24',
        border: '1px solid #202531',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <Text size="lg" weight="semibold" style={{ color: '#F7F8FA' }}>Delete project?</Text>
        <Text size="sm" style={{ color: '#94A0B8' }}>This action cannot be undone. All data will be permanently removed.</Text>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm">Cancel</Button>
          <Button variant="destructive" size="sm" iconLeft={<Icon icon={Trash2} size="xs" color="currentColor" />}>Delete</Button>
        </div>
      </div>

      <SectionLabel>Form actions</SectionLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" iconLeft={<Icon icon={Check} size="sm" color="currentColor" />}>Save</Button>
        <Button variant="secondary">Discard</Button>
        <div style={{ flex: 1 }} />
        <Button variant="tertiary" size="sm" iconLeft={<Icon icon={Settings} size="xs" color="currentColor" />}>Settings</Button>
      </div>

      <SectionLabel>Toolbar</SectionLabel>
      <div style={{
        display: 'flex',
        gap: 4,
        backgroundColor: '#161A24',
        padding: 6,
        borderRadius: 10,
        border: '1px solid #202531',
      }}>
        <Button variant="tertiary" size="xs" iconLeft={<Icon icon={Plus} size="xs" color="currentColor" />} style={{ color: '#94A0B8' }} />
        <Button variant="tertiary" size="xs" iconLeft={<Icon icon={Search} size="xs" color="currentColor" />} style={{ color: '#94A0B8' }} />
        <Button variant="tertiary" size="xs" iconLeft={<Icon icon={Settings} size="xs" color="currentColor" />} style={{ color: '#94A0B8' }} />
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="xs" shape="pill">Publish</Button>
      </div>

      <SectionLabel>Auth form</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
        <Button fullWidth variant="primary" size="lg">Sign In</Button>
        <Button fullWidth variant="secondary" size="lg" iconLeft={<Icon icon={Mail} size="md" color="currentColor" />}>
          Continue with Email
        </Button>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="tertiary" size="sm">Forgot password?</Button>
        </div>
      </div>
    </div>
  ),
};
