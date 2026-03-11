import React from 'react';
import { Tooltip, Button, HStack, Text, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function TooltipPreview() {
  const colors = useThemeColors();
  return (
    <div style={{ width: '100%', maxWidth: 200, position: 'relative', paddingTop: 32 }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', backgroundColor: colors.text.primary, borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 12, lineHeight: 1.4, color: colors.text.inverse }}>Tooltip text</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Text size="xs" color="secondary">Hover target ▲</Text>
      </div>
    </div>
  );
}

export const tooltipEntry: ComponentEntry = {
  slug: 'tooltip',
  name: 'Tooltip',
  category: 'components',
  subcategory: 'Overlays & Modals',
  description:
    'Hover-triggered tooltip with placement options, configurable delay, max width, and disabled state.',
  variantCount: 4,
  keywords: ['tooltip', 'hint', 'hover', 'info', 'help'],

  cardPreview: <TooltipPreview />,

  examples: [
    {
      title: 'Basic',
      render: (
        <HStack gap="md">
          <Tooltip content="This is a tooltip">
            <Button variant="secondary" size="sm">Hover me</Button>
          </Tooltip>
        </HStack>
      ),
      code: `import { Tooltip } from '@wisp-ui/react';\n\n<Tooltip content="This is a tooltip">
  <Button>Hover me</Button>
</Tooltip>`,
      rnCode: `import { Tooltip, Button } from '@wisp-ui/react-native';

<Tooltip content="This is a tooltip">
  <Button>Long press me</Button>
</Tooltip>`,
    },
    {
      title: 'Placements',
      render: (
        <HStack gap="md" style={{ flexWrap: 'wrap' }}>
          {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
            <Tooltip key={p} content={`Placed ${p}`} placement={p}>
              <Button variant="secondary" size="sm">{p}</Button>
            </Tooltip>
          ))}
        </HStack>
      ),
      code: `<Tooltip content="Info" placement="top"><Button>Top</Button></Tooltip>
<Tooltip content="Info" placement="bottom"><Button>Bottom</Button></Tooltip>
<Tooltip content="Info" placement="left"><Button>Left</Button></Tooltip>
<Tooltip content="Info" placement="right"><Button>Right</Button></Tooltip>`,
      rnCode: `<Tooltip content="Info" placement="top"><Button>Top</Button></Tooltip>
<Tooltip content="Info" placement="bottom"><Button>Bottom</Button></Tooltip>
<Tooltip content="Info" placement="left"><Button>Left</Button></Tooltip>
<Tooltip content="Info" placement="right"><Button>Right</Button></Tooltip>`,
    },
  ],

  props: [
    { name: 'content', type: 'React.ReactNode', required: true, description: 'Tooltip content.' },
    { name: 'children', type: 'React.ReactElement', required: true, description: 'Trigger element.' },
    { name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'Placement side.' },
    { name: 'delay', type: 'number', default: '300', description: 'Show delay in ms.' },
    { name: 'maxWidth', type: 'number', default: '220', description: 'Max width in px.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable tooltip.' },
  ],
};
