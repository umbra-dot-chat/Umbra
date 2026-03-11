import React from 'react';
import { Carousel, Text, Box, VStack, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

function CarouselPreview() {
  const colors = useThemeColors();
  return (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <Carousel showArrows={false}>
        <Box style={{ height: 60, backgroundColor: colors.background.sunken, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text size="xs">Slide 1</Text>
        </Box>
        <Box style={{ height: 60, backgroundColor: colors.background.sunken, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text size="xs">Slide 2</Text>
        </Box>
      </Carousel>
    </div>
  );
}

function BasicCarouselDemo() {
  const colors = useThemeColors();
  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Carousel>
        {[1, 2, 3, 4].map((n) => (
          <Box key={n} style={{ height: 180, backgroundColor: colors.background.sunken, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text size="lg" weight="bold">Slide {n}</Text>
          </Box>
        ))}
      </Carousel>
    </div>
  );
}

function AutoPlayCarouselDemo() {
  const colors = useThemeColors();
  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <Carousel autoPlay autoPlayInterval={3000} loop>
        {[1, 2, 3].map((n) => (
          <Box key={n} style={{ height: 140, backgroundColor: colors.background.sunken, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text size="md">Auto Slide {n}</Text>
          </Box>
        ))}
      </Carousel>
    </div>
  );
}

export const carouselEntry: ComponentEntry = {
  slug: 'carousel',
  name: 'Carousel',
  category: 'components',
  subcategory: 'Media',
  description:
    'Slide carousel with auto-play, loop, arrow navigation, dot indicators, controlled/uncontrolled index, and skeleton loading.',
  variantCount: 1,
  keywords: ['carousel', 'slider', 'slides', 'gallery', 'swipe'],

  cardPreview: <CarouselPreview />,

  examples: [
    {
      title: 'Basic',
      render: <BasicCarouselDemo />,
      code: `import { Carousel } from '@wisp-ui/react';\n\n<Carousel>
  <Box>Slide 1</Box>
  <Box>Slide 2</Box>
  <Box>Slide 3</Box>
</Carousel>`,
      rnCode: `import { Carousel, View, Text } from '@wisp-ui/react-native';

<Carousel>
  <View><Text>Slide 1</Text></View>
  <View><Text>Slide 2</Text></View>
  <View><Text>Slide 3</Text></View>
</Carousel>`,
    },
    {
      title: 'Auto-Play',
      render: <AutoPlayCarouselDemo />,
      code: `<Carousel autoPlay autoPlayInterval={3000} loop>
  <Box>Slide 1</Box>
  <Box>Slide 2</Box>
</Carousel>`,
      rnCode: `import { Carousel, View, Text } from '@wisp-ui/react-native';

<Carousel autoPlay autoPlayInterval={3000} loop>
  <View><Text>Slide 1</Text></View>
  <View><Text>Slide 2</Text></View>
</Carousel>`,
    },
  ],

  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Slide content (each child = slide).' },
    { name: 'autoPlay', type: 'boolean', default: 'false', description: 'Auto-advance slides.' },
    { name: 'autoPlayInterval', type: 'number', default: '5000', description: 'Auto-play interval (ms).' },
    { name: 'loop', type: 'boolean', default: 'true', description: 'Loop navigation.' },
    { name: 'showArrows', type: 'boolean', default: 'true', description: 'Show navigation arrows.' },
    { name: 'showDots', type: 'boolean', default: 'true', description: 'Show dot indicators.' },
    { name: 'onChange', type: '(index: number) => void', description: 'Slide change callback.' },
    { name: 'defaultIndex', type: 'number', default: '0', description: 'Initial slide (uncontrolled).' },
    { name: 'index', type: 'number', description: 'Controlled slide index.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Skeleton placeholder.' },
  ],
};
