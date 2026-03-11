import React from 'react';
import { LinkPreviewCard, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const linkPreviewCardEntry: ComponentEntry = {
  slug: 'link-preview-card',
  name: 'LinkPreviewCard',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'URL preview card showing title, description, image thumbnail, and domain — like link embeds in Telegram, Slack, and Discord.',
  variantCount: 1,
  keywords: ['link', 'preview', 'url', 'embed', 'og', 'opengraph', 'card', 'unfurl'],

  cardPreview: (
    <div style={{ width: '100%', pointerEvents: 'none' }}>
      <LinkPreviewCard
        url="https://github.com"
        title="GitHub"
        description="Where the world builds software."
        siteName="github.com"
        size="sm"
      />
    </div>
  ),

  examples: [
    {
      title: 'Default',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <LinkPreviewCard
            url="https://github.com/wisp-ui/wisp"
            title="Wisp UI Kit"
            description="A monochrome, cross-platform UI kit for React and React Native with 90+ components."
            siteName="github.com"
            image="https://placehold.co/600x300/1a1a1a/666?text=Preview"
          />
        </VStack>
      ),
      code: `import { LinkPreviewCard } from '@wisp-ui/react';

<LinkPreviewCard
  url="https://github.com/wisp-ui/wisp"
  title="Wisp UI Kit"
  description="A monochrome, cross-platform UI kit..."
  siteName="github.com"
  image="https://..."
/>`,
    },
    {
      title: 'Horizontal Layout',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <LinkPreviewCard
            url="https://example.com/article"
            title="How to Build a Messaging App"
            description="A comprehensive guide to building real-time messaging apps with modern web technologies."
            siteName="example.com"
            image="https://placehold.co/200x200/1a1a1a/666?text=IMG"
            layout="horizontal"
          />
        </VStack>
      ),
      code: `<LinkPreviewCard
  url="https://example.com/article"
  title="How to Build a Messaging App"
  description="A comprehensive guide..."
  layout="horizontal"
  image="https://..."
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 400 }}>
          <VStack gap="xs">
            <Text size="xs" color="secondary">sm</Text>
            <LinkPreviewCard
              url="https://example.com"
              title="Small Preview"
              description="This is a small link preview card."
              siteName="example.com"
              size="sm"
            />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">md</Text>
            <LinkPreviewCard
              url="https://example.com"
              title="Medium Preview"
              description="This is a medium link preview card with more room for description text."
              siteName="example.com"
              size="md"
            />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">lg</Text>
            <LinkPreviewCard
              url="https://example.com"
              title="Large Preview"
              description="This is a large link preview card with the most space for description text and bigger images."
              siteName="example.com"
              size="lg"
            />
          </VStack>
        </VStack>
      ),
      code: `<LinkPreviewCard size="sm" ... />
<LinkPreviewCard size="md" ... />
<LinkPreviewCard size="lg" ... />`,
    },
    {
      title: 'No Image',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <LinkPreviewCard
            url="https://docs.example.com/api"
            title="API Documentation"
            description="Complete reference for the REST API endpoints, authentication, and rate limiting."
            siteName="docs.example.com"
          />
        </VStack>
      ),
      code: `<LinkPreviewCard
  url="https://docs.example.com/api"
  title="API Documentation"
  description="Complete reference..."
  siteName="docs.example.com"
/>`,
    },
    {
      title: 'Auto-Fetch (Live Data)',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <Text size="xs" color="secondary">
            Fetches Open Graph metadata automatically from the URL
          </Text>
          <LinkPreviewCard
            url="https://github.com"
            autoFetch
          />
          <LinkPreviewCard
            url="https://react.dev"
            autoFetch
            layout="horizontal"
          />
        </VStack>
      ),
      code: `import { LinkPreviewCard } from '@wisp-ui/react';

// Just pass the URL — metadata is fetched automatically
<LinkPreviewCard url="https://github.com" autoFetch />

// Works with any layout
<LinkPreviewCard
  url="https://react.dev"
  autoFetch
  layout="horizontal"
/>

// Explicit props override fetched data
<LinkPreviewCard
  url="https://github.com"
  autoFetch
  title="Custom Title"  // overrides fetched title
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <LinkPreviewCard skeleton url="" />
          <LinkPreviewCard skeleton url="" layout="horizontal" />
        </VStack>
      ),
      code: `<LinkPreviewCard skeleton url="" />`,
    },
  ],

  props: [
    { name: 'url', type: 'string', description: 'The URL being previewed.' },
    { name: 'title', type: 'string', description: 'Title text from Open Graph / meta tags.' },
    { name: 'description', type: 'string', description: 'Description text from Open Graph / meta tags.' },
    { name: 'image', type: 'string', description: 'Image URL for the preview thumbnail.' },
    { name: 'siteName', type: 'string', description: 'Domain / site name (e.g. "github.com").' },
    { name: 'favicon', type: 'string', description: 'Favicon URL for the site.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'layout', type: "'horizontal' | 'vertical'", default: "'vertical'", description: 'Layout direction.' },
    { name: 'onPress', type: '() => void', description: 'Called when the card is clicked.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Whether the card is loading.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
    { name: 'autoFetch', type: 'boolean', default: 'false', description: 'Automatically fetch Open Graph metadata from the URL using Microlink API.' },
    { name: 'fetcher', type: '(url: string) => Promise<LinkPreviewData>', description: 'Custom fetcher function. Falls back to Microlink API when autoFetch is enabled.' },
  ],
};
