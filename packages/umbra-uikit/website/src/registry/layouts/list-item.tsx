import React from 'react';
import { ListItem, Text, VStack, Badge, Avatar } from '@wisp-ui/react';
import { Star, ChevronRight } from 'lucide-react';
import type { ComponentEntry } from '../types';

export const listItemEntry: ComponentEntry = {
  slug: 'list-item',
  name: 'ListItem',
  category: 'layouts',
  subcategory: 'Navigation & Wayfinding',
  description:
    'Structured row with leading, trailing, and content slots. Supports interactive states, sizes, and active highlighting.',
  variantCount: 3,
  keywords: ['list', 'item', 'row', 'leading', 'trailing'],

  cardPreview: (
    <VStack gap="xs" style={{ width: '100%', maxWidth: 220 }}>
      <ListItem size="sm" leading={<Star size={14} />} trailing={<ChevronRight size={14} />}>
        <Text>Favorites</Text>
      </ListItem>
      <ListItem size="sm" interactive active leading={<Star size={14} />}>
        <Text>Selected</Text>
      </ListItem>
    </VStack>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <VStack style={{ width: '100%', maxWidth: 320 }}>
          <ListItem leading={<Avatar size="sm" name="John Doe" />} trailing={<Badge variant="info">New</Badge>}>
            <Text weight="medium">John Doe</Text>
          </ListItem>
          <ListItem leading={<Avatar size="sm" name="Alice Smith" />} trailing={<Text size="xs" color="tertiary">2m ago</Text>}>
            <Text weight="medium">Alice Smith</Text>
          </ListItem>
        </VStack>
      ),
      code: `import { ListItem } from '@wisp-ui/react';

<ListItem leading={<Avatar name="John Doe" />} trailing={<Badge>New</Badge>}>
  John Doe
</ListItem>`,
      rnCode: `import { ListItem } from '@wisp-ui/react-native';

<ListItem leading={<Avatar name="John Doe" />} trailing={<Badge>New</Badge>}>
  John Doe
</ListItem>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="sm" style={{ width: '100%', maxWidth: 320 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <ListItem key={size} size={size} interactive>
              <Text>{size} list item</Text>
            </ListItem>
          ))}
        </VStack>
      ),
      code: `<ListItem size="sm">Small</ListItem>
<ListItem size="md">Medium</ListItem>
<ListItem size="lg">Large</ListItem>`,
      rnCode: `<ListItem size="sm">Small</ListItem>
<ListItem size="md">Medium</ListItem>
<ListItem size="lg">Large</ListItem>`,
    },
    {
      title: 'Interactive & Active',
      render: (
        <VStack style={{ width: '100%', maxWidth: 320 }}>
          <ListItem interactive leading={<Star size={16} />} trailing={<ChevronRight size={16} />}>
            <Text>Hover me</Text>
          </ListItem>
          <ListItem interactive active leading={<Star size={16} />}>
            <Text weight="medium">Active item</Text>
          </ListItem>
          <ListItem disabled leading={<Star size={16} />}>
            <Text>Disabled</Text>
          </ListItem>
        </VStack>
      ),
      code: `<ListItem interactive>Hover me</ListItem>
<ListItem interactive active>Active</ListItem>
<ListItem disabled>Disabled</ListItem>`,
      rnCode: `<ListItem interactive onPress={() => {}}>Press me</ListItem>
<ListItem interactive active>Active</ListItem>
<ListItem disabled>Disabled</ListItem>`,
    },
  ],

  props: [
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height and padding preset.' },
    { name: 'leading', type: 'React.ReactNode', description: 'Leading slot (icon, avatar).' },
    { name: 'trailing', type: 'React.ReactNode', description: 'Trailing slot (badge, action).' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Vertical alignment.' },
    { name: 'interactive', type: 'boolean', default: 'false', description: 'Hover/active styles.' },
    { name: 'active', type: 'boolean', default: 'false', description: 'Active/selected state.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'as', type: 'React.ElementType', default: "'div'", description: 'Polymorphic root element.' },
  ],
};
