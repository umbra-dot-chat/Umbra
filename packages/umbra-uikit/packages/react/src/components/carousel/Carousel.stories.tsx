import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Carousel } from './Carousel';

const meta: Meta<typeof Carousel> = {
  title: 'Components/Carousel',
  component: Carousel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Carousel>;

// ---------------------------------------------------------------------------
// Shared slide helper
// ---------------------------------------------------------------------------

const slideColors = ['#6366F1', '#EC4899', '#14B8A6'] as const;
const slideLabels = ['Slide One', 'Slide Two', 'Slide Three'] as const;

const DemoSlide = ({ color, label }: { color: string; label: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 240,
      backgroundColor: color,
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: 600,
      userSelect: 'none',
    }}
  >
    {label}
  </div>
);

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Carousel>
        {slideColors.map((c, i) => (
          <DemoSlide key={i} color={c} label={slideLabels[i]} />
        ))}
      </Carousel>
    </div>
  ),
};

export const AutoPlay: Story = {
  name: 'AutoPlay',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Carousel autoPlay autoPlayInterval={2000}>
        {slideColors.map((c, i) => (
          <DemoSlide key={i} color={c} label={slideLabels[i]} />
        ))}
      </Carousel>
    </div>
  ),
};

export const WithoutArrows: Story = {
  name: 'WithoutArrows',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Carousel showArrows={false}>
        {slideColors.map((c, i) => (
          <DemoSlide key={i} color={c} label={slideLabels[i]} />
        ))}
      </Carousel>
    </div>
  ),
};

export const WithoutDots: Story = {
  name: 'WithoutDots',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Carousel showDots={false}>
        {slideColors.map((c, i) => (
          <DemoSlide key={i} color={c} label={slideLabels[i]} />
        ))}
      </Carousel>
    </div>
  ),
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [idx, setIdx] = useState(0);
    return (
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Carousel index={idx} onChange={setIdx}>
          {slideColors.map((c, i) => (
            <DemoSlide key={i} color={c} label={slideLabels[i]} />
          ))}
        </Carousel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, opacity: 0.7 }}>
            Active slide: {idx + 1} / {slideColors.length}
          </span>
          <button
            type="button"
            onClick={() => setIdx((idx + 1) % slideColors.length)}
            style={{
              padding: '4px 12px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'none',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            Next (external)
          </button>
        </div>
      </div>
    );
  },
};

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Carousel skeleton aspectRatio="16/9">
        <div />
      </Carousel>
    </div>
  ),
};
