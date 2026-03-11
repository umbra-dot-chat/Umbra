import React from 'react';
import { Image as WispImage, HStack, VStack, Text } from '@wisp-ui/react';
import { ImageOff } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const imageEntry: ComponentEntry = {
  slug: 'image',
  name: 'Image',
  category: 'primitives',
  subcategory: 'Media & Display',
  description:
    'Image component with built-in loading skeleton, error fallback, lazy loading, object-fit control, aspect-ratio support, and six radius presets.',
  variantCount: 4,
  keywords: ['image', 'photo', 'picture', 'media', 'lazy', 'skeleton'],

  cardPreview: (
    <HStack gap="sm" align="center">
      <WispImage
        src="https://picsum.photos/seed/wisp-card-1/80/80"
        alt="Preview 1"
        radius="md"
        aspectRatio="1/1"
        style={{ width: 48 }}
      />
      <WispImage
        src="https://picsum.photos/seed/wisp-card-2/80/80"
        alt="Preview 2"
        radius="full"
        aspectRatio="1/1"
        style={{ width: 48 }}
      />
      <WispImage
        src="https://picsum.photos/seed/wisp-card-3/80/80"
        alt="Preview 3"
        radius="lg"
        aspectRatio="1/1"
        style={{ width: 48 }}
      />
    </HStack>
  ),

  examples: [
    {
      title: 'Basic with Aspect Ratio',
      render: (
        <VStack gap="md">
          <WispImage
            src="https://picsum.photos/seed/wisp-basic/400/300"
            alt="Scenic landscape"
            aspectRatio="4/3"
            radius="md"
            style={{ width: 320 }}
          />
        </VStack>
      ),
      code: `import { Image } from '@wisp-ui/react';

<Image
  src="https://picsum.photos/400/300"
  alt="Scenic landscape"
  aspectRatio="4/3"
  radius="md"
  style={{ width: 320 }}
/>`,
    },
    {
      title: 'Radius Variants',
      render: (
        <HStack gap="md" align="end">
          {(['none', 'sm', 'md', 'lg', 'xl', 'full'] as const).map((r) => (
            <VStack key={r} gap="xs" align="center">
              <WispImage
                src={`https://picsum.photos/seed/wisp-radius-${r}/120/120`}
                alt={`Radius ${r}`}
                radius={r}
                aspectRatio="1/1"
                style={{ width: 72 }}
              />
              <Text size="xs" color="tertiary">{r}</Text>
            </VStack>
          ))}
        </HStack>
      ),
      code: `import { Image } from '@wisp-ui/react';

<Image src="..." radius="none" />
<Image src="..." radius="sm" />
<Image src="..." radius="md" />
<Image src="..." radius="lg" />
<Image src="..." radius="xl" />
<Image src="..." radius="full" />`,
    },
    {
      title: 'Error Fallback',
      render: (
        <HStack gap="md" align="center">
          <VStack gap="xs" align="center">
            <WispImage
              src="https://invalid.url/does-not-exist.jpg"
              alt="Broken image"
              radius="md"
              aspectRatio="4/3"
              style={{ width: 160 }}
            />
            <Text size="xs" color="tertiary">default fallback</Text>
          </VStack>
          <VStack gap="xs" align="center">
            <WispImage
              src="https://invalid.url/does-not-exist.jpg"
              alt="Custom fallback"
              radius="md"
              aspectRatio="4/3"
              style={{ width: 160 }}
              fallback={
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageOff size={32} />
                </div>
              }
            />
            <Text size="xs" color="tertiary">custom fallback</Text>
          </VStack>
        </HStack>
      ),
      code: `import { Image } from '@wisp-ui/react';

{/* Default fallback (ImageOff icon) */}
<Image src="https://invalid.url/missing.jpg" alt="Broken" radius="md" />

{/* Custom fallback */}
<Image
  src="https://invalid.url/missing.jpg"
  alt="Broken"
  radius="md"
  fallback={<span>No image available</span>}
/>`,
    },
    {
      title: 'Skeleton Loading',
      render: (
        <HStack gap="md" align="center">
          <VStack gap="xs" align="center">
            <WispImage
              skeleton
              aspectRatio="4/3"
              radius="md"
              style={{ width: 160 }}
            />
            <Text size="xs" color="tertiary">skeleton</Text>
          </VStack>
          <VStack gap="xs" align="center">
            <WispImage
              skeleton
              aspectRatio="1/1"
              radius="full"
              style={{ width: 80 }}
            />
            <Text size="xs" color="tertiary">circular</Text>
          </VStack>
        </HStack>
      ),
      code: `import { Image } from '@wisp-ui/react';

<Image skeleton aspectRatio="4/3" radius="md" style={{ width: 160 }} />
<Image skeleton aspectRatio="1/1" radius="full" style={{ width: 80 }} />`,
    },
  ],

  props: [
    { name: 'src', type: 'string', description: 'Image URL source.' },
    { name: 'alt', type: 'string', description: 'Accessible alt text for the image.' },
    { name: 'objectFit', type: "'cover' | 'contain' | 'fill' | 'none'", default: "'cover'", description: 'How the image fits within its container.' },
    { name: 'aspectRatio', type: 'string', description: "CSS aspect-ratio value (e.g. '16/9', '1/1')." },
    { name: 'radius', type: "'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'none'", description: 'Border-radius preset for the wrapper.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton pulse while loading.' },
    { name: 'lazy', type: 'boolean', default: 'true', description: 'Use native lazy loading attribute.' },
    { name: 'fallback', type: 'React.ReactNode', description: 'Custom fallback content on load error.' },
  ],
};
