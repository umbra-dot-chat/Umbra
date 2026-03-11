import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { cardVariants, cardPaddings, cardRadii } from '@coexist/wisp-core/types/Card.types';
import { Text } from '../../primitives/text';
import { Button } from '../../primitives/button';
import { Icon } from '../../primitives/icon';
import { Star, ArrowRight } from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'Layouts/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...cardVariants] },
    padding: { control: 'select', options: [...cardPaddings] },
    radius: { control: 'select', options: [...cardRadii] },
    interactive: { control: 'boolean' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" color="tertiary" weight="semibold" as="div" style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
    {children}
  </Text>
);

export const Default: Story = {
  args: {
    children: (
      <div>
        <Text size="md" weight="semibold" as="p" style={{ margin: 0 }}>Card Title</Text>
        <Text size="sm" color="secondary" as="p" style={{ margin: '4px 0 0' }}>Card description goes here.</Text>
      </div>
    ),
  },
};

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {cardVariants.map((variant) => (
        <Card key={variant} variant={variant} style={{ width: 200 }}>
          <SectionLabel>{variant}</SectionLabel>
          <Text size="sm" color="secondary">Content inside a {variant} card.</Text>
        </Card>
      ))}
    </div>
  ),
};

export const Paddings: Story = {
  name: 'Paddings',
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {cardPaddings.map((padding) => (
        <Card key={padding} padding={padding} variant="outlined" style={{ width: 180 }}>
          <SectionLabel>{padding}</SectionLabel>
          <Text size="sm" color="secondary">Padding: {padding}</Text>
        </Card>
      ))}
    </div>
  ),
};

export const Interactive: Story = {
  name: 'Interactive',
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <Card interactive onClick={() => {}} style={{ width: 200 }}>
        <Text size="sm" weight="semibold">Clickable card</Text>
        <Text size="xs" color="secondary" as="p" style={{ margin: '4px 0 0' }}>Hover and click me</Text>
      </Card>
      <Card interactive selected onClick={() => {}} style={{ width: 200 }}>
        <Text size="sm" weight="semibold">Selected card</Text>
        <Text size="xs" color="secondary" as="p" style={{ margin: '4px 0 0' }}>Currently active</Text>
      </Card>
      <Card interactive disabled onClick={() => {}} style={{ width: 200 }}>
        <Text size="sm" weight="semibold">Disabled card</Text>
        <Text size="xs" color="secondary" as="p" style={{ margin: '4px 0 0' }}>Cannot interact</Text>
      </Card>
    </div>
  ),
};

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Card skeleton style={{ width: 200, height: 120 }} />
      <Card skeleton radius="lg" style={{ width: 200, height: 120 }} />
    </div>
  ),
};

export const Glass: Story = {
  name: 'Glass',
  render: () => (
    <div style={{ padding: 32, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', borderRadius: 12 }}>
      <Card variant="glass" style={{ width: 280 }}>
        <Text size="md" weight="semibold" as="p" style={{ margin: 0, color: 'inherit' }}>Glass Card</Text>
        <Text size="sm" as="p" style={{ margin: '4px 0 0', color: 'inherit', opacity: 0.7 }}>
          A translucent card with backdrop blur, ideal for layered surfaces.
        </Text>
      </Card>
    </div>
  ),
};

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <SectionLabel>Feature card</SectionLabel>
      <Card variant="outlined">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Icon icon={Star} size="md" />
          <div style={{ flex: 1 }}>
            <Text size="md" weight="semibold" as="p" style={{ margin: 0 }}>Premium Plan</Text>
            <Text size="sm" color="secondary" as="p" style={{ margin: '4px 0 12px' }}>
              Unlock all features and priority support.
            </Text>
            <Button size="sm" iconRight={<Icon icon={ArrowRight} size="xs" />}>
              Upgrade
            </Button>
          </div>
        </div>
      </Card>
    </div>
  ),
};
