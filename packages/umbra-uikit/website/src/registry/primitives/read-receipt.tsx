import React from 'react';
import { ReadReceipt, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const readReceiptEntry: ComponentEntry = {
  slug: 'read-receipt',
  name: 'ReadReceipt',
  category: 'primitives',
  subcategory: 'Media & Display',
  description:
    'Message delivery status indicator showing sent, delivered, read, and failed states with inline icons. Essential for chat interfaces.',
  variantCount: 5,
  keywords: ['read', 'receipt', 'status', 'sent', 'delivered', 'check', 'message', 'chat', 'tick'],

  cardPreview: (
    <HStack gap="lg" style={{ alignItems: 'center', pointerEvents: 'none' }}>
      <ReadReceipt status="sent" size="md" />
      <ReadReceipt status="delivered" size="md" />
      <ReadReceipt status="read" size="md" />
      <ReadReceipt status="failed" size="md" />
    </HStack>
  ),

  examples: [
    {
      title: 'All Statuses',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="sending" size="md" />
            <Text size="xs" color="secondary">Sending</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="sent" size="md" />
            <Text size="xs" color="secondary">Sent</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="delivered" size="md" />
            <Text size="xs" color="secondary">Delivered</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="read" size="md" />
            <Text size="xs" color="secondary">Read</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="failed" size="md" />
            <Text size="xs" color="secondary">Failed</Text>
          </VStack>
        </HStack>
      ),
      code: `import { ReadReceipt } from '@wisp-ui/react';

<ReadReceipt status="sending" />
<ReadReceipt status="sent" />
<ReadReceipt status="delivered" />
<ReadReceipt status="read" />
<ReadReceipt status="failed" />`,
    },
    {
      title: 'With Timestamp',
      render: (
        <VStack gap="md">
          <ReadReceipt status="sent" timestamp="2:30 PM" size="sm" />
          <ReadReceipt status="delivered" timestamp="2:31 PM" size="sm" />
          <ReadReceipt status="read" timestamp="2:35 PM" size="sm" />
        </VStack>
      ),
      code: `<ReadReceipt status="sent" timestamp="2:30 PM" />
<ReadReceipt status="read" timestamp="2:35 PM" />`,
    },
    {
      title: 'With Label',
      render: (
        <VStack gap="md">
          <ReadReceipt status="sent" showLabel size="md" />
          <ReadReceipt status="delivered" showLabel size="md" />
          <ReadReceipt status="read" showLabel size="md" />
          <ReadReceipt status="failed" showLabel size="md" />
        </VStack>
      ),
      code: `<ReadReceipt status="read" showLabel />`,
    },
    {
      title: 'Sizes',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="read" size="xs" />
            <Text size="xs" color="secondary">xs</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="read" size="sm" />
            <Text size="xs" color="secondary">sm</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="read" size="md" />
            <Text size="xs" color="secondary">md</Text>
          </VStack>
          <VStack gap="xs" style={{ alignItems: 'center' }}>
            <ReadReceipt status="read" size="lg" />
            <Text size="xs" color="secondary">lg</Text>
          </VStack>
        </HStack>
      ),
      code: `<ReadReceipt status="read" size="xs" />
<ReadReceipt status="read" size="sm" />
<ReadReceipt status="read" size="md" />
<ReadReceipt status="read" size="lg" />`,
    },
    {
      title: 'Skeleton',
      render: (
        <HStack gap="lg">
          <ReadReceipt status="sent" size="sm" skeleton />
          <ReadReceipt status="sent" size="md" skeleton />
        </HStack>
      ),
      code: `<ReadReceipt status="sent" skeleton />`,
    },
  ],

  props: [
    { name: 'status', type: "'sending' | 'sent' | 'delivered' | 'read' | 'failed'", required: true, description: 'Current delivery status.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'sm'", description: 'Size preset.' },
    { name: 'timestamp', type: 'string', description: 'Optional timestamp text (e.g. "2:30 PM").' },
    { name: 'showLabel', type: 'boolean', default: 'false', description: 'Show label text alongside icon.' },
    { name: 'labels', type: 'Partial<Record<ReadReceiptStatus, string>>', description: 'Custom labels for each status.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
