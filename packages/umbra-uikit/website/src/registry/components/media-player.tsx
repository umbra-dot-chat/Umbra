import React from 'react';
import { MediaPlayer, VStack, Text, HStack } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const mediaPlayerEntry: ComponentEntry = {
  slug: 'media-player',
  name: 'MediaPlayer',
  category: 'components',
  subcategory: 'Media',
  description:
    'Audio and video player with seek bar, volume, playback speed, and fullscreen controls. No major UI kit ships a native media player — instant differentiator.',
  variantCount: 2,
  keywords: [
    'media', 'player', 'audio', 'video', 'music', 'sound', 'playback',
    'seek', 'volume', 'speed', 'fullscreen', 'controls', 'stream',
  ],

  cardPreview: (
    <VStack gap="sm" style={{ width: '100%', pointerEvents: 'none' }}>
      <MediaPlayer
        src=""
        variant="audio"
        title="Ambient Dreams"
        artist="Wisp Audio"
        size="sm"
        skeleton
      />
    </VStack>
  ),

  examples: [
    {
      title: 'Audio Player',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 480 }}>
          <MediaPlayer
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            variant="audio"
            title="SoundHelix Song 1"
            artist="T. Schürger"
          />
        </VStack>
      ),
      code: `import { MediaPlayer } from '@wisp-ui/react';

<MediaPlayer
  src="https://example.com/song.mp3"
  variant="audio"
  title="My Song"
  artist="Artist Name"
/>`,
    },
    {
      title: 'Video Player',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 640 }}>
          <MediaPlayer
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            variant="video"
            poster="https://peach.blender.org/wp-content/uploads/bbb-splash.png"
          />
        </VStack>
      ),
      code: `<MediaPlayer
  src="https://example.com/video.mp4"
  variant="video"
  poster="https://example.com/poster.jpg"
/>`,
    },
    {
      title: 'Sizes',
      render: (
        <VStack gap="lg" style={{ width: '100%', maxWidth: 480 }}>
          <VStack gap="xs">
            <Text size="xs" color="secondary">sm</Text>
            <MediaPlayer
              src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              variant="audio"
              title="Small Player"
              size="sm"
            />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">md</Text>
            <MediaPlayer
              src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              variant="audio"
              title="Medium Player"
              size="md"
            />
          </VStack>
          <VStack gap="xs">
            <Text size="xs" color="secondary">lg</Text>
            <MediaPlayer
              src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              variant="audio"
              title="Large Player"
              size="lg"
            />
          </VStack>
        </VStack>
      ),
      code: `<MediaPlayer src={url} size="sm" title="Small" />
<MediaPlayer src={url} size="md" title="Medium" />
<MediaPlayer src={url} size="lg" title="Large" />`,
    },
    {
      title: 'Minimal Controls',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 480 }}>
          <MediaPlayer
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            variant="audio"
            title="Minimal"
            showVolume={false}
            showSpeed={false}
          />
        </VStack>
      ),
      code: `<MediaPlayer
  src={url}
  title="Minimal"
  showVolume={false}
  showSpeed={false}
/>`,
    },
    {
      title: 'Skeleton',
      render: (
        <VStack gap="md" style={{ width: '100%', maxWidth: 480 }}>
          <MediaPlayer src="" variant="audio" skeleton />
          <MediaPlayer src="" variant="video" skeleton />
        </VStack>
      ),
      code: `<MediaPlayer src="" variant="audio" skeleton />
<MediaPlayer src="" variant="video" skeleton />`,
    },
  ],

  props: [
    { name: 'src', type: 'string', required: true, description: 'Media source URL.' },
    { name: 'variant', type: "'audio' | 'video'", default: "'audio'", description: 'Media type.' },
    { name: 'poster', type: 'string', description: 'Poster image for video variant.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size preset.' },
    { name: 'title', type: 'string', description: 'Track title displayed in audio controls.' },
    { name: 'artist', type: 'string', description: 'Artist / subtitle text.' },
    { name: 'autoPlay', type: 'boolean', default: 'false', description: 'Auto-play on mount.' },
    { name: 'loop', type: 'boolean', default: 'false', description: 'Loop playback.' },
    { name: 'muted', type: 'boolean', default: 'false', description: 'Muted by default.' },
    { name: 'showVolume', type: 'boolean', default: 'true', description: 'Show volume control.' },
    { name: 'showSpeed', type: 'boolean', default: 'true', description: 'Show playback speed control.' },
    { name: 'showFullscreen', type: 'boolean', default: 'true', description: 'Show fullscreen button (video only).' },
    { name: 'showTime', type: 'boolean', default: 'true', description: 'Show time display.' },
    { name: 'onPlayStateChange', type: '(playing: boolean) => void', description: 'Called when playback state changes.' },
    { name: 'onTimeUpdate', type: '(currentTime: number, duration: number) => void', description: 'Called on time update.' },
    { name: 'onEnded', type: '() => void', description: 'Called when media ends.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton.' },
  ],
};
