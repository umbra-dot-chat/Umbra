import React from 'react';
import { Text, Box, HStack, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import { DemoBox } from '../../shared/DemoBox';

function FloatingCardPreview() {
  const colors = useThemeColors();
  return (
    <Box style={{ width: '100%', maxWidth: 200, position: 'relative', padding: '24px 0' }}>
      <DemoBox p="sm" radius="sm" style={{ textAlign: 'center', width: 80, margin: '0 auto' }}>
        <Text>Anchor</Text>
      </DemoBox>
      <DemoBox intensity="strong" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', borderRadius: 6, padding: '4px 8px' }}>
        <Text>Float</Text>
      </DemoBox>
    </Box>
  );
}

function FloatingPlacementsExample() {
  const colors = useThemeColors();
  return (
    <HStack gap="xl" align="center" style={{ flexWrap: 'wrap' }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
        <Box key={p} style={{ position: 'relative', padding: 32 }}>
          <DemoBox p="sm" radius="sm" style={{ textAlign: 'center', width: 60 }}>
            <Text>Anchor</Text>
          </DemoBox>
          <DemoBox intensity="strong" style={{
            position: 'absolute',
            ...(p === 'top' ? { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: -24 } :
              p === 'bottom' ? { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: -24 } :
              p === 'left' ? { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: -24 } :
              { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: -24 }),
            borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' as const
          }}>
            <Text>{p}</Text>
          </DemoBox>
        </Box>
      ))}
    </HStack>
  );
}

export const floatingEntry: ComponentEntry = {
  slug: 'floating',
  name: 'Floating',
  category: 'layouts',
  subcategory: 'Scrolling & Positioning',
  description:
    'Positions content relative to an anchor element with placement, alignment, offset, and collision strategies (flip/shift).',
  variantCount: 4,
  keywords: ['floating', 'popover', 'anchor', 'position', 'tooltip'],

  cardPreview: <FloatingCardPreview />,

  examples: [
    {
      title: 'Placements',
      render: <FloatingPlacementsExample />,
      code: `import { Floating } from '@wisp-ui/react';

<Floating open placement="top" content={<div>Tooltip</div>}>
  <Button>Anchor</Button>
</Floating>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactElement', required: true, description: 'Anchor/trigger element.' },
    { name: 'content', type: 'React.ReactNode', required: true, description: 'Floating content.' },
    { name: 'open', type: 'boolean', required: true, description: 'Visibility state.' },
    { name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: "'bottom'", description: 'Placement side.' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Cross-axis alignment.' },
    { name: 'offset', type: 'number', default: '8', description: 'Distance from anchor in px.' },
    { name: 'strategy', type: "'flip' | 'shift' | 'none'", default: "'flip'", description: 'Collision strategy.' },
    { name: 'portal', type: 'boolean', default: 'true', description: 'Render in portal.' },
  ],
};
