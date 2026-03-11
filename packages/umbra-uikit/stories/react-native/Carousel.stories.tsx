import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Carousel, Text } from '@wisp-ui/react-native';

const slideColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

function Slide({ color, index }: { color: string; index: number }) {
  return (
    <div
      style={{
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
      }}
    >
      <Text size="xl" style={{ color: '#fff', fontWeight: '700' }}>
        Slide {index + 1}
      </Text>
    </div>
  );
}

const meta: Meta<typeof Carousel> = {
  title: 'React Native/Components/Data Display/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  argTypes: {
    autoPlay: { control: 'boolean' },
    autoPlayInterval: { control: 'number' },
    loop: { control: 'boolean' },
    showArrows: { control: 'boolean' },
    showDots: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Carousel>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Default carousel
      </div>
      <Carousel>
        {slideColors.map((c, i) => (
          <Slide key={i} color={c} index={i} />
        ))}
      </Carousel>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Auto-Play
// ---------------------------------------------------------------------------

export const AutoPlay: Story = {
  name: 'Auto-Play',
  render: () => (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Auto-plays every 3 seconds
      </div>
      <Carousel autoPlay autoPlayInterval={3000} loop>
        {slideColors.map((c, i) => (
          <Slide key={i} color={c} index={i} />
        ))}
      </Carousel>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. With Indicators
// ---------------------------------------------------------------------------

export const WithIndicators: Story = {
  name: 'With Indicators',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Arrows + dots (default)
        </div>
        <Carousel showArrows showDots>
          {slideColors.map((c, i) => (
            <Slide key={i} color={c} index={i} />
          ))}
        </Carousel>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Dots only
        </div>
        <Carousel showArrows={false} showDots>
          {slideColors.map((c, i) => (
            <Slide key={i} color={c} index={i} />
          ))}
        </Carousel>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          No indicators
        </div>
        <Carousel showArrows={false} showDots={false}>
          {slideColors.map((c, i) => (
            <Slide key={i} color={c} index={i} />
          ))}
        </Carousel>
      </div>
    </div>
  ),
};
