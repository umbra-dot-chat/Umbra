/**
 * VideoGrid -- Responsive grid layout for video call participants.
 *
 * @remarks
 * Displays participant tiles in a CSS grid that auto-adjusts columns
 * based on participant count. Supports two layout modes:
 *
 * - `'grid'` (default): Equal-sized tiles. Column count scales from 1 to 4.
 * - `'spotlight'`: One participant shown large with others in a horizontal strip below.
 *
 * Each tile shows a video stream or avatar + name fallback, plus mute/deafen/speaking
 * indicators. Overflow participants beyond `maxVisible` are represented with a "+N" badge.
 *
 * @module components/video-grid
 *
 * @example
 * ```tsx
 * <VideoGrid
 *   participants={participants}
 *   layout="grid"
 *   onParticipantClick={(id) => console.log('clicked', id)}
 * />
 * ```
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import type {
  VideoGridProps,
  VideoParticipant,
} from '@coexist/wisp-core/types/VideoGrid.types';
import {
  resolveGridColumns,
  buildVideoGridContainerStyle,
  buildSpotlightContainerStyle,
  buildSpotlightMainStyle,
  buildSpotlightStripStyle,
  buildSpotlightStripTileStyle,
  buildVideoTileStyle,
  buildVideoStreamStyle,
  buildTileFallbackStyle,
  buildTileNameStyle,
  buildTileIndicatorsStyle,
  buildIndicatorIconStyle,
  buildOverflowBadgeStyle,
  buildVideoGridSkeletonStyle,
  buildTileSkeletonStyle,
} from '@coexist/wisp-core/styles/VideoGrid.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Internal: Participant tile
// ---------------------------------------------------------------------------

interface TileProps {
  participant: VideoParticipant;
  onClick?: (id: string) => void;
  tileStyle: React.CSSProperties;
  streamStyle: React.CSSProperties;
  fallbackStyle: React.CSSProperties;
  nameStyle: React.CSSProperties;
  indicatorsStyle: React.CSSProperties;
  indicatorIconStyle: React.CSSProperties;
}

function ParticipantTile({
  participant,
  onClick,
  tileStyle,
  streamStyle,
  fallbackStyle,
  nameStyle,
  indicatorsStyle,
  indicatorIconStyle,
}: TileProps) {
  const p = participant;
  const showFallback = p.isCameraOff || !p.videoStream;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={p.name}
      style={tileStyle}
      onClick={() => onClick?.(p.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(p.id);
        }
      }}
    >
      {/* Video stream */}
      {!showFallback && p.videoStream && (
        <div style={streamStyle}>{p.videoStream}</div>
      )}

      {/* Fallback: avatar + name */}
      {showFallback && (
        <div style={fallbackStyle}>
          {p.avatar}
          {!p.avatar && (
            <span style={{ fontSize: 24, fontWeight: 600 }}>
              {p.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* Status indicators */}
      <div style={indicatorsStyle}>
        {p.isMuted && (
          <span style={indicatorIconStyle} title="Muted" aria-label="Muted">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </span>
        )}
        {p.isDeafened && (
          <span style={indicatorIconStyle} title="Deafened" aria-label="Deafened">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M18 16v-3a6 6 0 0 0-9.32-5" />
              <path d="M6 10v2a6 6 0 0 0 9.33 5" />
            </svg>
          </span>
        )}
        {p.isScreenSharing && (
          <span style={indicatorIconStyle} title="Screen sharing" aria-label="Screen sharing">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </span>
        )}
      </div>

      {/* Name label */}
      <span style={nameStyle}>{p.name}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VideoGrid
// ---------------------------------------------------------------------------

export const VideoGrid = forwardRef<HTMLDivElement, VideoGridProps>(function VideoGrid(
  {
    participants,
    layout = 'grid',
    spotlightId,
    onParticipantClick,
    maxVisible = 25,
    showOverflowCount = true,
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();

  // -----------------------------------------------------------------------
  // Skeleton
  // -----------------------------------------------------------------------
  const skeletonContainerStyle = useMemo(
    () => buildVideoGridSkeletonStyle(theme),
    [theme],
  );
  const skeletonTileStyle = useMemo(
    () => buildTileSkeletonStyle(theme),
    [theme],
  );

  if (skeleton) {
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonContainerStyle, ...userStyle } as React.CSSProperties}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={skeletonTileStyle as React.CSSProperties} />
        ))}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Visible participants and overflow
  // -----------------------------------------------------------------------
  const visibleParticipants = participants.slice(0, maxVisible);
  const overflowCount = participants.length - maxVisible;
  const hasOverflow = overflowCount > 0 && showOverflowCount;

  // -----------------------------------------------------------------------
  // Shared tile styles (memoized)
  // -----------------------------------------------------------------------
  const streamStyle = useMemo(
    () => buildVideoStreamStyle() as React.CSSProperties,
    [],
  );
  const fallbackStyle = useMemo(
    () => buildTileFallbackStyle(theme) as React.CSSProperties,
    [theme],
  );
  const nameStyle = useMemo(
    () => buildTileNameStyle(theme) as React.CSSProperties,
    [theme],
  );
  const indicatorsStyle = useMemo(
    () => buildTileIndicatorsStyle() as React.CSSProperties,
    [],
  );
  const indicatorIconStyle = useMemo(
    () => buildIndicatorIconStyle(theme) as React.CSSProperties,
    [theme],
  );
  const overflowStyle = useMemo(
    () => buildOverflowBadgeStyle(theme) as React.CSSProperties,
    [theme],
  );

  // -----------------------------------------------------------------------
  // Build tile style for a participant
  // -----------------------------------------------------------------------
  const buildTile = useCallback(
    (p: VideoParticipant) =>
      buildVideoTileStyle(!!p.isSpeaking, theme) as React.CSSProperties,
    [theme],
  );

  // -----------------------------------------------------------------------
  // Spotlight layout
  // -----------------------------------------------------------------------
  if (layout === 'spotlight') {
    const spotlightParticipant =
      visibleParticipants.find((p) => p.id === spotlightId) ?? visibleParticipants[0];
    const stripParticipants = spotlightParticipant
      ? visibleParticipants.filter((p) => p.id !== spotlightParticipant.id)
      : [];

    const containerStyle = buildSpotlightContainerStyle(theme) as React.CSSProperties;
    const mainStyle = buildSpotlightMainStyle() as React.CSSProperties;
    const stripStyle = buildSpotlightStripStyle() as React.CSSProperties;
    const stripTileStyle = buildSpotlightStripTileStyle() as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
        data-testid="video-grid"
        {...rest}
      >
        {/* Main spotlight tile */}
        {spotlightParticipant && (
          <div style={mainStyle}>
            <ParticipantTile
              participant={spotlightParticipant}
              onClick={onParticipantClick}
              tileStyle={buildTile(spotlightParticipant)}
              streamStyle={streamStyle}
              fallbackStyle={fallbackStyle}
              nameStyle={nameStyle}
              indicatorsStyle={indicatorsStyle}
              indicatorIconStyle={indicatorIconStyle}
            />
          </div>
        )}

        {/* Strip of other participants */}
        {stripParticipants.length > 0 && (
          <div style={stripStyle}>
            {stripParticipants.map((p) => (
              <div key={p.id} style={stripTileStyle}>
                <ParticipantTile
                  participant={p}
                  onClick={onParticipantClick}
                  tileStyle={buildTile(p)}
                  streamStyle={streamStyle}
                  fallbackStyle={fallbackStyle}
                  nameStyle={nameStyle}
                  indicatorsStyle={indicatorsStyle}
                  indicatorIconStyle={indicatorIconStyle}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Grid layout (default)
  // -----------------------------------------------------------------------
  const displayCount = hasOverflow ? visibleParticipants.length + 1 : visibleParticipants.length;
  const cols = resolveGridColumns(displayCount);
  const containerStyle = buildVideoGridContainerStyle(cols, theme) as React.CSSProperties;

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
      data-testid="video-grid"
      {...rest}
    >
      {visibleParticipants.map((p) => (
        <ParticipantTile
          key={p.id}
          participant={p}
          onClick={onParticipantClick}
          tileStyle={buildTile(p)}
          streamStyle={streamStyle}
          fallbackStyle={fallbackStyle}
          nameStyle={nameStyle}
          indicatorsStyle={indicatorsStyle}
          indicatorIconStyle={indicatorIconStyle}
        />
      ))}

      {/* Overflow tile */}
      {hasOverflow && (
        <div style={overflowStyle}>+{overflowCount}</div>
      )}
    </div>
  );
});

VideoGrid.displayName = 'VideoGrid';
