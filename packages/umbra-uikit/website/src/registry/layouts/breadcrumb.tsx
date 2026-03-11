import React from 'react';
import { Breadcrumb, BreadcrumbItem, HStack, Text, VStack } from '@wisp-ui/react';
import { Home } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const breadcrumbEntry: ComponentEntry = {
  slug: 'breadcrumb',
  name: 'Breadcrumb',
  category: 'layouts',
  subcategory: 'Navigation & Wayfinding',
  description:
    'Navigation breadcrumb trail with auto separators, size variants, icon support, and active state for current page.',
  variantCount: 3,
  keywords: ['breadcrumb', 'navigation', 'trail', 'path', 'crumb'],

  cardPreview: (
    <Breadcrumb size="sm">
      <BreadcrumbItem>Home</BreadcrumbItem>
      <BreadcrumbItem>Docs</BreadcrumbItem>
      <BreadcrumbItem active>Breadcrumb</BreadcrumbItem>
    </Breadcrumb>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <Breadcrumb>
          <BreadcrumbItem href="#">Home</BreadcrumbItem>
          <BreadcrumbItem href="#">Products</BreadcrumbItem>
          <BreadcrumbItem active>Details</BreadcrumbItem>
        </Breadcrumb>
      ),
      code: `import { Breadcrumb, BreadcrumbItem } from '@wisp-ui/react';

<Breadcrumb>
  <BreadcrumbItem href="#">Home</BreadcrumbItem>
  <BreadcrumbItem href="#">Products</BreadcrumbItem>
  <BreadcrumbItem active>Details</BreadcrumbItem>
</Breadcrumb>`,
      rnCode: `import { Breadcrumb, BreadcrumbItem } from '@wisp-ui/react-native';

<Breadcrumb>
  <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
  <BreadcrumbItem onPress={() => {}}>Products</BreadcrumbItem>
  <BreadcrumbItem active>Details</BreadcrumbItem>
</Breadcrumb>`,
    },
    {
      title: 'With Icon',
      render: (
        <Breadcrumb>
          <BreadcrumbItem href="#" icon={<Home size={14} />}>Home</BreadcrumbItem>
          <BreadcrumbItem href="#">Settings</BreadcrumbItem>
          <BreadcrumbItem active>Profile</BreadcrumbItem>
        </Breadcrumb>
      ),
      code: `<Breadcrumb>
  <BreadcrumbItem href="#" icon={<Home size={14} />}>Home</BreadcrumbItem>
  <BreadcrumbItem href="#">Settings</BreadcrumbItem>
  <BreadcrumbItem active>Profile</BreadcrumbItem>
</Breadcrumb>`,
      rnCode: `<Breadcrumb>
  <BreadcrumbItem onPress={() => {}} icon={<Home size={14} />}>Home</BreadcrumbItem>
  <BreadcrumbItem onPress={() => {}}>Settings</BreadcrumbItem>
  <BreadcrumbItem active>Profile</BreadcrumbItem>
</Breadcrumb>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 24 }}>{size}</Text>
              <Breadcrumb size={size}>
                <BreadcrumbItem href="#">Home</BreadcrumbItem>
                <BreadcrumbItem active>Page</BreadcrumbItem>
              </Breadcrumb>
            </HStack>
          ))}
        </VStack>
      ),
      code: `<Breadcrumb size="sm">…</Breadcrumb>
<Breadcrumb size="md">…</Breadcrumb>
<Breadcrumb size="lg">…</Breadcrumb>`,
      rnCode: `<Breadcrumb size="sm">…</Breadcrumb>
<Breadcrumb size="md">…</Breadcrumb>
<Breadcrumb size="lg">…</Breadcrumb>`,
    },
  ],

  props: [
    { name: 'separator', type: 'React.ReactNode', description: 'Custom separator (default: ChevronRight).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size.' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'BreadcrumbItem elements.' },
  ],
};
