import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';
import { textSizes, textWeights, textColors } from '@coexist/wisp-core/types/Text.types';
import { Icon } from '../icon';
import { Search, AlertCircle, CheckCircle, ArrowRight, Star, Info, Zap } from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Text> = {
  title: 'Primitives/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...textSizes] },
    weight: { control: 'select', options: [...textWeights] },
    color: { control: 'select', options: [...textColors] },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Sizes — all 11 steps
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Body Sizes</SectionLabel>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <Text size="xs" color="tertiary" style={{ width: 32, flexShrink: 0, textAlign: 'right' }}>{size}</Text>
          <Text size={size}>The quick brown fox jumps over the lazy dog</Text>
        </div>
      ))}

      <div style={{ height: 16 }} />
      <SectionLabel>Display Sizes</SectionLabel>
      {(['display-xs', 'display-sm', 'display-md', 'display-lg', 'display-xl', 'display-2xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text size="xs" color="tertiary">{size}</Text>
          <Text size={size} weight="semibold">Display heading</Text>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Weights — all 4 weights
// ---------------------------------------------------------------------------

export const Weights: Story = {
  name: 'Weights',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['regular', 'medium', 'semibold', 'bold'] as const).map((weight) => (
        <div key={weight} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <Text size="xs" color="tertiary" style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>{weight}</Text>
          <Text size="lg" weight={weight}>The quick brown fox jumps over the lazy dog</Text>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Colors — all 10 color variants
// ---------------------------------------------------------------------------

export const Colors: Story = {
  name: 'Colors',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel>Neutral Colors</SectionLabel>
      <Text size="md" color="primary">primary — Main body text</Text>
      <Text size="md" color="secondary">secondary — Supporting text</Text>
      <Text size="md" color="tertiary">tertiary — Muted / placeholder</Text>
      <Text size="md" color="disabled">disabled — Non-interactive</Text>

      <div style={{ height: 8 }} />
      <SectionLabel>Semantic Colors (status only)</SectionLabel>
      <Text size="md" color="error">error — Something went wrong</Text>
      <Text size="md" color="warning">warning — Proceed with caution</Text>
      <Text size="md" color="success">success — Operation completed</Text>

      <div style={{ height: 8 }} />
      <SectionLabel>Special</SectionLabel>
      <Text size="md" color="brand">brand — Accent color</Text>
      <div style={{ padding: '8px 12px', backgroundColor: '#0F1219', borderRadius: 6, display: 'inline-block' }}>
        <Text size="md" color="white">white — Always white (on dark surfaces)</Text>
      </div>
      <Text size="md" color="inverse">inverse — Opposite of current mode</Text>
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
      <Text size="sm" iconLeft={<Icon icon={Search} size="xs" />}>Search results</Text>
      <Text size="md" iconLeft={<Icon icon={AlertCircle} size="sm" color="error" />} color="error">Error occurred</Text>
      <Text size="md" iconLeft={<Icon icon={CheckCircle} size="sm" color="success" />} color="success">All checks passed</Text>
      <Text size="md" iconLeft={<Icon icon={Info} size="sm" color="secondary" />} color="secondary">Additional information</Text>

      <div style={{ height: 8 }} />
      <SectionLabel>Icon Right</SectionLabel>
      <Text size="md" iconRight={<Icon icon={ArrowRight} size="sm" />}>Continue</Text>
      <Text size="md" iconRight={<Icon icon={Zap} size="sm" />} weight="medium">Upgrade to Pro</Text>

      <div style={{ height: 8 }} />
      <SectionLabel>Both Icons</SectionLabel>
      <Text size="md" iconLeft={<Icon icon={Star} size="sm" />} iconRight={<Icon icon={ArrowRight} size="sm" />} weight="medium">Featured item</Text>
      <Text size="lg" iconLeft={<Icon icon={CheckCircle} size="sm" color="success" />} iconRight={<Icon icon={ArrowRight} size="sm" />} weight="semibold" color="success">Verified account</Text>

      <div style={{ height: 8 }} />
      <SectionLabel>Scaled with Size</SectionLabel>
      <Text size="xs" iconLeft={<Icon icon={Star} size="xs" />}>Extra small with icon</Text>
      <Text size="sm" iconLeft={<Icon icon={Star} size="xs" />}>Small with icon</Text>
      <Text size="md" iconLeft={<Icon icon={Star} size="sm" />}>Medium with icon</Text>
      <Text size="lg" iconLeft={<Icon icon={Star} size="sm" />}>Large with icon</Text>
      <Text size="xl" iconLeft={<Icon icon={Star} size="md" />}>Extra large with icon</Text>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Truncation — single-line and multi-line clamp
// ---------------------------------------------------------------------------

export const Truncation: Story = {
  name: 'Truncation',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
      <SectionLabel>Single-line truncation (truncate)</SectionLabel>
      <div style={{ border: '1px solid #37404F', borderRadius: 6, padding: 12 }}>
        <Text size="md" truncate>
          This is a very long text that should be truncated with an ellipsis when it overflows the container boundary
        </Text>
      </div>

      <SectionLabel>Multi-line clamp (maxLines=2)</SectionLabel>
      <div style={{ border: '1px solid #37404F', borderRadius: 6, padding: 12 }}>
        <Text size="md" maxLines={2}>
          This is a longer paragraph of text that will be clamped to two lines using the -webkit-line-clamp CSS property.
          Any text beyond the second line will be hidden and replaced with an ellipsis to indicate there is more content available.
        </Text>
      </div>

      <SectionLabel>Multi-line clamp (maxLines=3)</SectionLabel>
      <div style={{ border: '1px solid #37404F', borderRadius: 6, padding: 12 }}>
        <Text size="sm" maxLines={3} color="secondary">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </Text>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 6. Skeleton Loading
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Skeleton at different sizes</SectionLabel>
      <Text skeleton size="xs" />
      <Text skeleton size="sm" />
      <Text skeleton size="md" />
      <Text skeleton size="lg" />
      <Text skeleton size="xl" />
      <Text skeleton size="display-xs" />
      <Text skeleton size="display-sm" />

      <div style={{ height: 8 }} />
      <SectionLabel>Skeleton vs loaded (side by side)</SectionLabel>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <Text size="xs" color="tertiary" weight="medium">Loading</Text>
          <Text skeleton size="display-xs" />
          <Text skeleton size="md" />
          <Text skeleton size="md" />
          <Text skeleton size="sm" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <Text size="xs" color="tertiary" weight="medium">Loaded</Text>
          <Text size="display-xs" weight="semibold">Dashboard</Text>
          <Text size="md">Welcome back. Here is your overview.</Text>
          <Text size="md" color="secondary">Last updated 5 minutes ago.</Text>
          <Text size="sm" color="tertiary">v2.4.1</Text>
        </div>
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 7. Font Families — sans vs mono
// ---------------------------------------------------------------------------

export const Families: Story = {
  name: 'Families',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionLabel>Sans (default)</SectionLabel>
      <Text size="md" family="sans">The quick brown fox jumps over the lazy dog — 0123456789</Text>

      <div style={{ height: 4 }} />
      <SectionLabel>Mono</SectionLabel>
      <Text size="md" family="mono">The quick brown fox jumps over the lazy dog — 0123456789</Text>

      <div style={{ height: 8 }} />
      <SectionLabel>Mono in context</SectionLabel>
      <Text size="sm" color="secondary">
        Run <Text as="code" family="mono" size="sm" style={{ backgroundColor: '#202531', padding: '2px 6px', borderRadius: 4 }}>npm install @wisp/ui</Text> to get started.
      </Text>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 8. Alignment
// ---------------------------------------------------------------------------

export const Alignment: Story = {
  name: 'Alignment',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
      {(['left', 'center', 'right', 'justify'] as const).map((align) => (
        <div key={align} style={{ border: '1px solid #37404F', borderRadius: 6, padding: 12 }}>
          <Text size="xs" color="tertiary" weight="medium" style={{ marginBottom: 4 }} as="div">{align}</Text>
          <Text size="md" align={align} as="p">
            The quick brown fox jumps over the lazy dog. This text demonstrates the {align} alignment option.
          </Text>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 9. As Elements — polymorphic rendering
// ---------------------------------------------------------------------------

export const AsElements: Story = {
  name: 'As Elements',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel>Semantic HTML elements via &quot;as&quot; prop</SectionLabel>
      <Text as="h1" size="display-md" weight="bold">h1 — Page title</Text>
      <Text as="h2" size="display-xs" weight="semibold">h2 — Section heading</Text>
      <Text as="h3" size="xl" weight="semibold">h3 — Subsection</Text>
      <Text as="p" size="md" color="secondary">p — Body paragraph text with secondary color for supporting content.</Text>
      <Text as="small" size="xs" color="tertiary">small — Fine print and disclaimers</Text>
      <Text as="strong" size="md" weight="bold">strong — Bold emphasis</Text>
      <Text as="em" size="md" style={{ fontStyle: 'italic' }}>em — Italic emphasis</Text>
      <Text as="code" size="sm" family="mono" color="inverse" style={{ backgroundColor: '#202531', padding: '2px 6px', borderRadius: 4 }}>
        code — inline code snippet
      </Text>
      <Text as="blockquote" size="lg" color="secondary" style={{ borderLeft: '3px solid #37404F', paddingLeft: 16 }}>
        blockquote — A wise person once said something meaningful.
      </Text>
      <Text as="label" size="sm" weight="medium">label — Form field label</Text>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 10. Composition — real-world usage patterns using Icon primitive
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <SectionLabel>Card-like layout</SectionLabel>
      <div style={{
        backgroundColor: '#161A24',
        border: '1px solid #202531',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <Text size="xs" color="tertiary" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          Total Balance
        </Text>
        <Text size="display-sm" weight="bold" color="white">$19,232.00</Text>
        <Text size="sm" color="secondary">Updated just now</Text>
      </div>

      <SectionLabel>Error state</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Icon icon={AlertCircle} size="sm" color="error" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <Text size="sm" weight="medium" color="error">Invalid email address</Text>
          <Text size="sm" color="secondary" as="p">Please enter a valid email to continue.</Text>
        </div>
      </div>

      <SectionLabel>Success state</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Icon icon={CheckCircle} size="sm" color="success" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <Text size="sm" weight="medium" color="success">Changes saved</Text>
          <Text size="sm" color="secondary" as="p">Your profile has been updated successfully.</Text>
        </div>
      </div>

      <SectionLabel>Navigation item</SectionLabel>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: 8,
        backgroundColor: '#202531',
        cursor: 'pointer',
      }}>
        <Text size="sm" weight="medium" iconLeft={<Icon icon={Star} size="sm" color="white" />} color="white">Favorites</Text>
        <Text size="xs" color="tertiary">12</Text>
      </div>
    </div>
  ),
};
