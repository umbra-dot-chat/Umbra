import React, { useState } from 'react';
import { TagInput, VStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function TagInputDemo() {
  const [tags, setTags] = useState(['React', 'TypeScript']);
  return <TagInput value={tags} onChange={setTags} label="Skills" placeholder="Add skill…" />;
}

export const tagInputEntry: ComponentEntry = {
  slug: 'tag-input',
  name: 'TagInput',
  category: 'primitives',
  subcategory: 'Inputs',
  description:
    'Multi-value tag input with add/remove, max limit, duplicate control, custom separators, validation, and skeleton loading.',
  variantCount: 5,
  keywords: ['tag', 'input', 'multi', 'chips', 'tokens', 'form'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 240, pointerEvents: 'none' }}>
      <TagInput defaultValue={['React', 'Vite']} size="sm" placeholder="Add…" />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <TagInputDemo />
        </div>
      ),
      code: `import { TagInput } from '@wisp-ui/react';

const [tags, setTags] = useState(['React', 'TypeScript']);
<TagInput value={tags} onChange={setTags} label="Skills" placeholder="Add skill…" />`,
      rnCode: `import { TagInput } from '@wisp-ui/react-native';

<TagInput
  label="Tags"
  placeholder="Add tags..."
  defaultValue={['react', 'native']}
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <TagInput key={size} defaultValue={['Tag 1', 'Tag 2']} size={size} placeholder={size} />
          ))}
        </VStack>
      ),
      code: `<TagInput size="sm" defaultValue={['Tag 1']} />
<TagInput size="md" defaultValue={['Tag 1']} />`,
    },
    {
      title: 'With Constraints',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <TagInput defaultValue={['A', 'B', 'C']} max={5} label="Max 5 tags" hint="2 remaining" placeholder="Add tag…" />
          <TagInput defaultValue={['unique']} allowDuplicates={false} label="No duplicates" placeholder="Add unique tag…" />
        </VStack>
      ),
      code: `<TagInput max={5} label="Max 5 tags" />
<TagInput allowDuplicates={false} label="No duplicates" />`,
    },
    {
      title: 'Validation',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <TagInput defaultValue={['Tag']} error="At least 3 tags required" />
          <TagInput defaultValue={['Tag']} warning="Consider adding more tags" />
        </VStack>
      ),
      code: `<TagInput error="At least 3 tags required" />
<TagInput warning="Consider adding more" />`,
    },
  ],

  props: [
    { name: 'value', type: 'string[]', description: 'Controlled tags array.' },
    { name: 'defaultValue', type: 'string[]', description: 'Default tags (uncontrolled).' },
    { name: 'onChange', type: '(tags: string[]) => void', description: 'Callback on tags change.' },
    { name: 'onTagAdd', type: '(tag: string) => void', description: 'Callback when tag is added.' },
    { name: 'onTagRemove', type: '(tag: string) => void', description: 'Callback when tag is removed.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Input size.' },
    { name: 'max', type: 'number', default: 'Infinity', description: 'Maximum number of tags.' },
    { name: 'allowDuplicates', type: 'boolean', default: 'true', description: 'Allow duplicate tags.' },
    { name: 'separators', type: 'string[]', default: "[',']", description: 'Characters that trigger tag creation.' },
    { name: 'label', type: 'string', description: 'Label text.' },
    { name: 'hint', type: 'string', description: 'Hint text.' },
    { name: 'error', type: 'string | boolean', description: 'Error message or state.' },
    { name: 'warning', type: 'string | boolean', description: 'Warning message or state.' },
    { name: 'placeholder', type: 'string', description: 'Input placeholder text.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show skeleton loading.' },
  ],
};
