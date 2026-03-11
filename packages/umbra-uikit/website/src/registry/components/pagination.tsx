import React, { useState } from 'react';
import { Pagination, VStack, HStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function PaginationDemo() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} totalPages={10} onChange={setPage} />;
}

export const paginationEntry: ComponentEntry = {
  slug: 'pagination',
  name: 'Pagination',
  category: 'components',
  subcategory: 'Navigation',
  description:
    'Page navigation with prev/next, first/last, sibling count, size variants, and disabled state.',
  variantCount: 3,
  keywords: ['pagination', 'paging', 'page', 'navigation', 'next', 'previous'],

  cardPreview: (
    <div style={{ pointerEvents: 'none' }}>
      <Pagination page={3} totalPages={10} onChange={() => {}} size="sm" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <PaginationDemo />,
      code: `import { Pagination } from '@wisp-ui/react';\n\nconst [page, setPage] = useState(1);
<Pagination page={page} totalPages={10} onChange={setPage} />`,
      rnCode: `import { Pagination } from '@wisp-ui/react-native';
import { useState } from 'react';

const [page, setPage] = useState(1);
<Pagination page={page} totalPages={10} onChange={setPage} />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" align="start">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <HStack key={size} gap="md" align="center">
              <Text size="xs" color="tertiary" style={{ width: 24 }}>{size}</Text>
              <Pagination page={3} totalPages={10} onChange={() => {}} size={size} />
            </HStack>
          ))}
        </VStack>
      ),
      code: `<Pagination size="sm" page={3} totalPages={10} />
<Pagination size="md" page={3} totalPages={10} />
<Pagination size="lg" page={3} totalPages={10} />`,
      rnCode: `import { Pagination } from '@wisp-ui/react-native';

<Pagination size="sm" page={3} totalPages={10} onChange={() => {}} />
<Pagination size="md" page={3} totalPages={10} onChange={() => {}} />
<Pagination size="lg" page={3} totalPages={10} onChange={() => {}} />`,
    },
  ],

  props: [
    { name: 'page', type: 'number', required: true, description: 'Current page (1-based).' },
    { name: 'totalPages', type: 'number', required: true, description: 'Total number of pages.' },
    { name: 'onChange', type: '(page: number) => void', required: true, description: 'Page change callback.' },
    { name: 'siblingCount', type: 'number', default: '1', description: 'Visible siblings on each side.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'showFirstLast', type: 'boolean', default: 'true', description: 'Show first/last buttons.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all buttons.' },
  ],
};
