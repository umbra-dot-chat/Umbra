import React from 'react';
import { AudioWaveform, HStack, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// Sample waveform data
const chatWaveform = [
  0.2, 0.4, 0.3, 0.7, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7,
  0.3, 0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.6, 0.3, 0.5,
  0.7, 0.8, 0.4, 0.6, 0.9, 0.5, 0.3, 0.7, 0.4, 0.2,
];

const musicWaveform = [
  0.1, 0.3, 0.5, 0.4, 0.7, 0.9, 0.8, 1.0, 0.9, 0.7,
  0.5, 0.6, 0.8, 0.9, 1.0, 0.8, 0.6, 0.4, 0.5, 0.7,
  0.8, 0.9, 0.7, 0.5, 0.6, 0.8, 1.0, 0.9, 0.7, 0.5,
  0.3, 0.4, 0.6, 0.8, 0.7, 0.5, 0.3, 0.2, 0.4, 0.3,
];

export const audioWaveformEntry: ComponentEntry = {
  slug: 'audio-waveform',
  name: 'AudioWaveform',
  category: 'components',
  subcategory: 'Media',
  description:
    'Visual waveform representation of audio data. Supports bars, line, and mirrored variants with playback progress and seek interaction. Perfect for chat voice messages and audio players.',
  variantCount: 3,
  keywords: [
    'audio', 'waveform', 'wave', 'sound', 'voice', 'bars', 'line',
    'visualizer', 'chat', 'message', 'music', 'player', 'seek',
  ],

  cardPreview: (
    <VStack gap="sm" style={{ width: '100%', pointerEvents: 'none' }}>
      <AudioWaveform data={chatWaveform} size="md" progress={0.6} color="default" responsive />
      <AudioWaveform data={musicWaveform} variant="mirror" size="sm" progress={0.4} color="info" responsive />
    </VStack>
  ),

  examples: [
    {
      title: 'Variants',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 400 }}>
          <VStack gap="xs">
            <Text size="xs" color="secondary">Bars</Text>
            <AudioWaveform data={chatWaveform} variant="bars" size="lg" progress={0.5} responsive />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">Line</Text>
            <AudioWaveform data={chatWaveform} variant="line" size="lg" progress={0.5} responsive />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">Mirror</Text>
            <AudioWaveform data={musicWaveform} variant="mirror" size="lg" progress={0.5} responsive />
          </VStack>
        </VStack>
      ),
      code: `import { AudioWaveform } from '@wisp-ui/react';

<AudioWaveform data={data} variant="bars" progress={0.5} />
<AudioWaveform data={data} variant="line" progress={0.5} />
<AudioWaveform data={data} variant="mirror" progress={0.5} />`,
    },
    {
      title: 'Colors',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <AudioWaveform data={chatWaveform} color="default" size="md" progress={0.6} responsive />
          <AudioWaveform data={chatWaveform} color="success" size="md" progress={0.6} responsive />
          <AudioWaveform data={chatWaveform} color="warning" size="md" progress={0.6} responsive />
          <AudioWaveform data={chatWaveform} color="danger" size="md" progress={0.6} responsive />
          <AudioWaveform data={chatWaveform} color="info" size="md" progress={0.6} responsive />
        </VStack>
      ),
      code: `<AudioWaveform data={data} color="success" progress={0.6} />
<AudioWaveform data={data} color="warning" progress={0.6} />
<AudioWaveform data={data} color="danger" progress={0.6} />
<AudioWaveform data={data} color="info" progress={0.6} />`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 400 }}>
          <VStack gap="xs">
            <Text size="xs" color="secondary">sm</Text>
            <AudioWaveform data={chatWaveform} size="sm" progress={0.4} responsive />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">md</Text>
            <AudioWaveform data={chatWaveform} size="md" progress={0.4} responsive />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">lg</Text>
            <AudioWaveform data={chatWaveform} size="lg" progress={0.4} responsive />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">xl</Text>
            <AudioWaveform data={chatWaveform} size="xl" progress={0.4} responsive />
          </VStack>
        </VStack>
      ),
      code: `<AudioWaveform data={data} size="sm" />
<AudioWaveform data={data} size="md" />
<AudioWaveform data={data} size="lg" />
<AudioWaveform data={data} size="xl" />`,
    },
    {
      title: 'With Progress',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <AudioWaveform data={chatWaveform} size="lg" progress={0} responsive />
          <AudioWaveform data={chatWaveform} size="lg" progress={0.3} responsive color="info" />
          <AudioWaveform data={chatWaveform} size="lg" progress={0.7} responsive color="success" />
          <AudioWaveform data={chatWaveform} size="lg" progress={1} responsive color="default" />
        </VStack>
      ),
      code: `<AudioWaveform data={data} progress={0} />
<AudioWaveform data={data} progress={0.3} />
<AudioWaveform data={data} progress={0.7} />
<AudioWaveform data={data} progress={1} />`,
    },
    {
      title: 'Animated Entry',
      render: (
        <HStack gap="xl" style={{ alignItems: 'center' }}>
          <AudioWaveform data={chatWaveform} size="lg" animated color="info" />
          <AudioWaveform data={musicWaveform} variant="mirror" size="lg" animated color="success" />
        </HStack>
      ),
      code: `<AudioWaveform data={data} animated />
<AudioWaveform data={data} variant="mirror" animated />`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 400 }}>
          <AudioWaveform data={[]} size="md" skeleton responsive />
          <AudioWaveform data={[]} size="lg" skeleton responsive />
        </VStack>
      ),
      code: `<AudioWaveform data={[]} skeleton />`,
    },
  ],

  props: [
    { name: 'data', type: 'number[]', required: true, description: 'Array of amplitude values (0–1 range).' },
    { name: 'variant', type: "'bars' | 'line' | 'mirror'", default: "'bars'", description: 'Waveform display variant.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Preset dimensions.' },
    { name: 'color', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Accent color.' },
    { name: 'progress', type: 'number', default: '0', description: 'Playback progress fraction (0–1).' },
    { name: 'playing', type: 'boolean', default: 'false', description: 'Whether audio is playing (animates bars).' },
    { name: 'responsive', type: 'boolean', default: 'false', description: 'Stretch to 100% of parent width.' },
    { name: 'animated', type: 'boolean', default: 'false', description: 'Animate bars on entry.' },
    { name: 'onSeek', type: '(fraction: number) => void', description: 'Called with 0–1 value when user clicks the waveform.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show a loading skeleton placeholder.' },
  ],
};
