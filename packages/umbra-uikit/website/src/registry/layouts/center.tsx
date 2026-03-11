import React from 'react';
import { Center, Text, Box, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import { DemoBox } from '../../shared/DemoBox';

function CenterCardPreview() {
  const colors = useThemeColors();
  return (
    <Center style={{ width: '100%', height: 80, backgroundColor: colors.border.subtle, borderRadius: 8 }}>
      <Text color="secondary">Centered</Text>
    </Center>
  );
}

function CenterBasicExample() {
  const colors = useThemeColors();
  return (
    <Center style={{ width: '100%', height: 160, backgroundColor: colors.border.subtle, borderRadius: 8 }}>
      <Text size="md">Centered Content</Text>
    </Center>
  );
}

function CenterInlineExample() {
  const colors = useThemeColors();
  return (
    <Box display="flex" style={{ gap: 12 }}>
      <Center inline style={{ width: 48, height: 48, backgroundColor: colors.border.subtle, borderRadius: 8 }}>
        <Text>A</Text>
      </Center>
      <Center inline style={{ width: 48, height: 48, backgroundColor: colors.border.subtle, borderRadius: 8 }}>
        <Text>B</Text>
      </Center>
    </Box>
  );
}

export const centerEntry: ComponentEntry = {
  slug: 'center',
  name: 'Center',
  category: 'layouts',
  subcategory: 'Spacing & Alignment',
  description:
    'Centers children both horizontally and vertically using flexbox. Supports inline mode.',
  variantCount: 1,
  keywords: ['center', 'align', 'middle', 'flex', 'justify'],

  cardPreview: <CenterCardPreview />,

  examples: [
    {
      title: 'Basic Center',
      render: <CenterBasicExample />,
      code: `import { Center } from '@wisp-ui/react';

<Center style={{ height: 160 }}>
  <Text>Centered Content</Text>
</Center>`,
      rnCode: `import { Center } from '@wisp-ui/react-native';

<Center style={{ height: 160 }}>
  <Text>Centered Content</Text>
</Center>`,
    },
    {
      title: 'Inline Center',
      render: <CenterInlineExample />,
      code: `<Center inline style={{ width: 48, height: 48 }}>A</Center>
<Center inline style={{ width: 48, height: 48 }}>B</Center>`,
      rnCode: `<Center style={{ width: 48, height: 48 }}>A</Center>
<Center style={{ width: 48, height: 48 }}>B</Center>`,
    },
  ],

  props: [
    { name: 'inline', type: 'boolean', default: 'false', description: 'Use inline-flex instead of flex.' },
    { name: 'as', type: 'React.ElementType', default: "'div'", description: 'Polymorphic root element.' },
    { name: 'children', type: 'React.ReactNode', description: 'Content to center.' },
  ],
};
