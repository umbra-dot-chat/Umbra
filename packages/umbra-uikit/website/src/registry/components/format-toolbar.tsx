import React, { useState } from 'react';
import { FormatToolbar, VStack, Text } from '@wisp-ui/react';
import type { FormatAction } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function InteractiveExample() {
  const [active, setActive] = useState<Set<FormatAction>>(new Set(['bold']));

  const handleAction = (action: FormatAction) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  return (
    <VStack gap="sm">
      <FormatToolbar
        onAction={handleAction}
        activeFormats={active}
      />
      <Text size="xs" color="muted">
        Active: {active.size > 0 ? [...active].join(', ') : 'none'}
      </Text>
    </VStack>
  );
}

export const formatToolbarEntry: ComponentEntry = {
  slug: 'format-toolbar',
  name: 'FormatToolbar',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Inline formatting toolbar with bold, italic, strikethrough, code, quote, and list actions for rich text editing.',
  variantCount: 2,
  keywords: ['format', 'toolbar', 'bold', 'italic', 'code', 'rich', 'text', 'editor', 'markdown', 'formatting'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <FormatToolbar
        onAction={() => {}}
        activeFormats={new Set(['bold', 'italic'] as FormatAction[])}
      />
    </div>
  ),

  examples: [
    {
      title: 'Interactive',
      render: <InteractiveExample />,
      code: `import { FormatToolbar } from '@wisp-ui/react';
import type { FormatAction } from '@wisp-ui/react';

const [active, setActive] = useState<Set<FormatAction>>(new Set());

<FormatToolbar
  onAction={(action) => {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(action) ? next.delete(action) : next.add(action);
      return next;
    });
  }}
  activeFormats={active}
/>`,
    },
    {
      title: 'Small Size',
      render: (
        <FormatToolbar
          onAction={() => {}}
          size="sm"
        />
      ),
      code: `<FormatToolbar onAction={handleFormat} size="sm" />`,
    },
    {
      title: 'Partial Actions',
      render: (
        <FormatToolbar
          onAction={() => {}}
          visibleActions={['bold', 'italic', 'strikethrough', 'code', 'link']}
          activeFormats={new Set(['code'] as FormatAction[])}
        />
      ),
      code: `<FormatToolbar
  onAction={handleFormat}
  visibleActions={['bold', 'italic', 'strikethrough', 'code', 'link']}
  activeFormats={new Set(['code'])}
/>`,
    },
    {
      title: 'With Disabled Actions',
      render: (
        <FormatToolbar
          onAction={() => {}}
          disabledActions={new Set(['codeBlock', 'orderedList', 'unorderedList'] as FormatAction[])}
        />
      ),
      code: `<FormatToolbar
  onAction={handleFormat}
  disabledActions={new Set(['codeBlock', 'orderedList', 'unorderedList'])}
/>`,
    },
  ],

  props: [
    { name: 'onAction', type: '(action: FormatAction) => void', description: 'Called when a format action button is clicked.' },
    { name: 'activeFormats', type: 'Set<FormatAction>', description: 'Set of currently active formatting states.' },
    { name: 'visibleActions', type: 'FormatAction[]', description: 'Actions to show. Defaults to all actions.' },
    { name: 'disabledActions', type: 'Set<FormatAction>', description: 'Actions to disable.' },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Size of the toolbar buttons.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the toolbar is disabled.' },
  ],
};
