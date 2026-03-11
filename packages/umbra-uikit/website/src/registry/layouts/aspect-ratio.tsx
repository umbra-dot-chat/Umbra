import React from 'react';
import { AspectRatio, Text, Box } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';
import { DemoBox } from '../../shared/DemoBox';

export const aspectRatioEntry: ComponentEntry = {
  slug: 'aspect-ratio',
  name: 'AspectRatio',
  category: 'layouts',
  subcategory: 'Spacing & Alignment',
  description:
    'Maintains a fixed aspect ratio for its children. Useful for images, video embeds, and responsive media containers.',
  variantCount: 1,
  keywords: ['aspect', 'ratio', 'responsive', 'image', 'video', 'media'],

  cardPreview: (
    <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 200, alignItems: 'flex-start' }}>
      <div style={{ width: 80 }}>
        <AspectRatio ratio={1}>
          <DemoBox radius="sm" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text size="xs">1:1</Text>
          </DemoBox>
        </AspectRatio>
      </div>
      <div style={{ width: 80 }}>
        <AspectRatio ratio={16 / 9}>
          <DemoBox radius="sm" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text size="xs">16:9</Text>
          </DemoBox>
        </AspectRatio>
      </div>
    </div>
  ),

  examples: [
    {
      title: 'Common Ratios',
      render: (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {[
            { ratio: 1, label: '1:1' },
            { ratio: 4 / 3, label: '4:3' },
            { ratio: 16 / 9, label: '16:9' },
            { ratio: 21 / 9, label: '21:9' },
          ].map(({ ratio, label }) => (
            <div key={label} style={{ width: 120 }}>
              <AspectRatio ratio={ratio}>
                <DemoBox radius="sm" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text>{label}</Text>
                </DemoBox>
              </AspectRatio>
            </div>
          ))}
        </div>
      ),
      code: `import { AspectRatio } from '@wisp-ui/react';

<AspectRatio ratio={1}>1:1</AspectRatio>
<AspectRatio ratio={4 / 3}>4:3</AspectRatio>
<AspectRatio ratio={16 / 9}>16:9</AspectRatio>`,
      rnCode: `import { AspectRatio } from '@wisp-ui/react-native';

<AspectRatio ratio={1}>1:1</AspectRatio>
<AspectRatio ratio={4 / 3}>4:3</AspectRatio>
<AspectRatio ratio={16 / 9}>16:9</AspectRatio>`,
    },
  ],

  props: [
    { name: 'ratio', type: 'number', default: '1', description: 'Aspect ratio as width / height.' },
    { name: 'children', type: 'React.ReactNode', description: 'Content to constrain.' },
  ],
};
