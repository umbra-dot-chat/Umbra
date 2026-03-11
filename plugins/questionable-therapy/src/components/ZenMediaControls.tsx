/**
 * ZenMediaControls -- Renders in the right-panel slot.
 *
 * Provides ambient audio controls: play/pause, track selection,
 * prev/next navigation, and volume slider for zen soundscapes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Pressable } from 'react-native';
import { Box, Text, VStack, HStack, Button, Separator, useTheme } from '@coexist/wisp-react-native';
import { ZEN_TRACKS } from '../constants';
import {
  subscribe,
  therapyActive,
  currentTrack,
  isPlaying,
  volume,
  setCurrentTrack,
  setIsPlaying,
  setVolume,
} from '../state';

/** Reference to the shared audio engine, set by index.ts */
let audioEngineRef: {
  play: (idx: number) => void;
  pause: () => void;
  resume: () => void;
  setVolume: (v: number) => void;
} | null = null;

/** Called by index.ts to wire the audio engine into the controls. */
export function setAudioEngineRef(engine: typeof audioEngineRef): void {
  audioEngineRef = engine;
}

export function ZenMediaControls() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngineRef?.pause();
      setIsPlaying(false);
    } else {
      audioEngineRef?.resume();
      setIsPlaying(true);
    }
  }, []);

  const handlePrev = useCallback(() => {
    const prev = (currentTrack - 1 + ZEN_TRACKS.length) % ZEN_TRACKS.length;
    setCurrentTrack(prev);
    audioEngineRef?.play(prev);
    setIsPlaying(true);
  }, []);

  const handleNext = useCallback(() => {
    const next = (currentTrack + 1) % ZEN_TRACKS.length;
    setCurrentTrack(next);
    audioEngineRef?.play(next);
    setIsPlaying(true);
  }, []);

  const handleTrackSelect = useCallback((index: number) => {
    setCurrentTrack(index);
    audioEngineRef?.play(index);
    setIsPlaying(true);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    audioEngineRef?.setVolume(v);
  }, []);

  if (!therapyActive) return null;

  const track = ZEN_TRACKS[currentTrack];

  return (
    <VStack
      gap={16}
      style={{
        padding: 16,
        backgroundColor: tc.background.surface,
        borderRadius: 8,
      }}
    >
      {/* Header */}
      <HStack gap={8} style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 18 }}>{'\uD83E\uDDD8'}</Text>
        <Text size="md" weight="semibold" style={{ color: tc.text.primary }}>
          Zen Audio
        </Text>
      </HStack>

      <Separator />

      {/* Now Playing */}
      <VStack gap={4}>
        <Text size="xs" style={{ color: tc.text.muted }}>
          Now Playing
        </Text>
        <Text size="sm" weight="semibold" style={{ color: tc.text.primary }}>
          {track?.name ?? 'Unknown'}
        </Text>
        <Text size="xs" style={{ color: tc.text.secondary }}>
          {track?.description ?? ''}
        </Text>
      </VStack>

      {/* Transport Controls */}
      <HStack gap={8} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Button variant="tertiary" size="sm" onPress={handlePrev}>
          Prev
        </Button>
        <Button variant="tertiary" size="sm" onPress={handlePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button variant="tertiary" size="sm" onPress={handleNext}>
          Next
        </Button>
      </HStack>

      {/* Volume */}
      <VStack gap={4}>
        <Text size="xs" style={{ color: tc.text.muted }}>
          Volume
        </Text>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          style={{
            width: '100%',
            accentColor: tc.accent.primary,
          }}
        />
      </VStack>

      <Separator />

      {/* Track List */}
      <VStack gap={4}>
        <Text size="xs" style={{ color: tc.text.muted }}>
          Tracks
        </Text>
        {ZEN_TRACKS.map((t, i) => {
          const isActive = i === currentTrack;
          return (
            <Pressable
              key={t.id}
              onPress={() => handleTrackSelect(i)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 8,
                borderRadius: 4,
                backgroundColor: isActive
                  ? tc.brand.surface
                  : 'transparent',
              }}
            >
              <VStack gap={2} style={{ flex: 1 }}>
                <Text
                  size="sm"
                  weight={isActive ? 'semibold' : 'regular'}
                  style={{
                    color: isActive ? tc.accent.primary : tc.text.primary,
                  }}
                >
                  {t.name}
                </Text>
                <Text size="xs" style={{ color: tc.text.muted }}>
                  {t.description}
                </Text>
              </VStack>
              {isActive && isPlaying && (
                <Text size="xs" style={{ color: tc.accent.primary }}>
                  {'\u266B'}
                </Text>
              )}
            </Pressable>
          );
        })}
      </VStack>
    </VStack>
  );
}
