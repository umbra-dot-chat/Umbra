import React from 'react';
import { RoleBadge, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const adminRole = { id: '1', name: 'Admin', color: '#E74C3C', position: 0 };
const modRole = { id: '2', name: 'Moderator', color: '#3498DB', position: 1 };
const memberRole = { id: '3', name: 'Member', color: '#2ECC71', position: 2 };
const vipRole = { id: '4', name: 'VIP', color: '#9B59B6', position: 3 };

export const roleBadgeEntry: ComponentEntry = {
  slug: 'role-badge',
  name: 'RoleBadge',
  category: 'components',
  subcategory: 'Roles & Permissions',
  description:
    'A colored pill badge displaying a user role with tinted background, colored dot indicator, and optional remove button.',
  variantCount: 3,
  keywords: ['role', 'badge', 'pill', 'tag', 'permission', 'user', 'community'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <HStack gap="sm">
        <RoleBadge role={adminRole} size="sm" />
        <RoleBadge role={modRole} size="sm" />
        <RoleBadge role={memberRole} size="sm" />
      </HStack>
    </div>
  ),

  examples: [
    {
      title: 'Sizes',
      render: (
        <VStack gap="md">
          <HStack gap="sm" style={{ alignItems: 'center' }}>
            <Text size="xs" color="secondary" style={{ width: 24 }}>xs</Text>
            <RoleBadge role={adminRole} size="xs" />
          </HStack>
          <HStack gap="sm" style={{ alignItems: 'center' }}>
            <Text size="xs" color="secondary" style={{ width: 24 }}>sm</Text>
            <RoleBadge role={modRole} size="sm" />
          </HStack>
          <HStack gap="sm" style={{ alignItems: 'center' }}>
            <Text size="xs" color="secondary" style={{ width: 24 }}>md</Text>
            <RoleBadge role={memberRole} size="md" />
          </HStack>
          <HStack gap="sm" style={{ alignItems: 'center' }}>
            <Text size="xs" color="secondary" style={{ width: 24 }}>lg</Text>
            <RoleBadge role={vipRole} size="lg" />
          </HStack>
        </VStack>
      ),
      code: `<RoleBadge role={{ id: '1', name: 'Admin', color: '#E74C3C', position: 0 }} size="xs" />
<RoleBadge role={{ id: '2', name: 'Moderator', color: '#3498DB', position: 1 }} size="sm" />
<RoleBadge role={{ id: '3', name: 'Member', color: '#2ECC71', position: 2 }} size="md" />
<RoleBadge role={{ id: '4', name: 'VIP', color: '#9B59B6', position: 3 }} size="lg" />`,
    },
    {
      title: 'Removable',
      render: (
        <HStack gap="sm">
          <RoleBadge role={adminRole} removable onRemove={() => {}} />
          <RoleBadge role={modRole} removable onRemove={() => {}} />
          <RoleBadge role={vipRole} removable onRemove={() => {}} />
        </HStack>
      ),
      code: `<RoleBadge role={adminRole} removable onRemove={() => removeRole(role.id)} />`,
    },
    {
      title: 'Multiple Roles',
      render: (
        <HStack gap="xs" style={{ flexWrap: 'wrap' }}>
          <RoleBadge role={adminRole} size="sm" />
          <RoleBadge role={modRole} size="sm" />
          <RoleBadge role={memberRole} size="sm" />
          <RoleBadge role={vipRole} size="sm" />
          <RoleBadge role={{ id: '5', name: 'Contributor', color: '#E67E22', position: 4 }} size="sm" />
        </HStack>
      ),
      code: `{roles.map(role => (
  <RoleBadge key={role.id} role={role} size="sm" />
))}`,
    },
  ],

  props: [
    { name: 'role', type: 'Role', required: true, description: 'Role object with id, name, color, position, and optional icon.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'sm'", description: 'Badge size variant.' },
    { name: 'removable', type: 'boolean', default: 'false', description: 'Whether to show a remove button.' },
    { name: 'onRemove', type: '() => void', description: 'Called when the remove button is clicked.' },
  ],
};
