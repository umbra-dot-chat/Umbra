/**
 * @module MediaPlayer
 * @description Audio and video player with seek bar, volume, playback speed,
 * and fullscreen controls. No major UI kit ships a native media player.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';
import type { MediaPlayerProps, PlaybackSpeed } from '@coexist/wisp-core/types/MediaPlayer.types';
import { mediaPlayerSizeMap, playbackSpeeds } from '@coexist/wisp-core/types/MediaPlayer.types';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import {
  resolveMediaPlayerColors,
  buildMediaPlayerContainerStyle,
  buildVideoContainerStyle,
  buildVideoElementStyle,
  buildControlBarStyle,
  buildControlButtonStyle,
  buildSeekBarContainerStyle,
  buildSeekBarTrackStyle,
  buildSeekBarFillStyle,
  buildTimeDisplayStyle,
  buildVolumeContainerStyle,
  buildVolumeSliderStyle,
  buildSpeedButtonStyle,
  buildAudioInfoStyle,
  buildAudioSeekRowStyle,
  buildMediaPlayerSkeletonStyle,
} from '@coexist/wisp-core/styles/MediaPlayer.styles';

// ---------------------------------------------------------------------------
// Time formatter
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Inline SVG Icons (no external deps)
// ---------------------------------------------------------------------------

function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" />
    </svg>
  );
}

function PauseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function VolumeHighIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
      <path d="M15.54 8.46a5 5 0 010 7.07" />
      <path d="M19.07 4.93a10 10 0 010 14.14" />
    </svg>
  );
}

function VolumeMuteIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function FullscreenIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MediaPlayer = forwardRef<HTMLDivElement, MediaPlayerProps>(function MediaPlayer(
  {
    src,
    variant = 'audio',
    poster,
    size = 'md',
    title,
    artist,
    autoPlay = false,
    loop = false,
    muted: initialMuted = false,
    showVolume = true,
    showSpeed = true,
    showFullscreen = true,
    showTime = true,
    onPlayStateChange,
    onTimeUpdate,
    onEnded,
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = mediaPlayerSizeMap[size];
  const isVideo = variant === 'video';

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seekRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialMuted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [showControls, setShowControls] = useState(true);

  const colors = useMemo(
    () => resolveMediaPlayerColors(theme),
    [theme],
  );

  // Skeleton early return
  if (skeleton) {
    const skeletonStyle = buildMediaPlayerSkeletonStyle(sizeConfig, theme, isVideo);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Styles
  const containerStyle = useMemo(
    () => buildMediaPlayerContainerStyle(sizeConfig, colors, isVideo, theme),
    [sizeConfig, colors, isVideo, theme],
  );

  const controlBarStyle = useMemo(
    () => buildControlBarStyle(sizeConfig, colors, isVideo),
    [sizeConfig, colors, isVideo],
  );

  const controlBtnStyle = useMemo(
    () => buildControlButtonStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  const seekContainerStyle = useMemo(
    () => buildSeekBarContainerStyle(sizeConfig),
    [sizeConfig],
  );

  const seekTrackStyle = useMemo(
    () => buildSeekBarTrackStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );

  const timeStyle = useMemo(
    () => buildTimeDisplayStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );

  // Progress fraction
  const progress = duration > 0 ? currentTime / duration : 0;
  const seekFillStyle = useMemo(
    () => buildSeekBarFillStyle(colors, progress),
    [colors, progress],
  );

  // ---------------------------------------------------------------------------
  // Media event handlers
  // ---------------------------------------------------------------------------

  const handleTimeUpdate = useCallback(() => {
    const media = mediaRef.current;
    if (media) {
      setCurrentTime(media.currentTime);
      onTimeUpdate?.(media.currentTime, media.duration || 0);
    }
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    const media = mediaRef.current;
    if (media) {
      setDuration(media.duration);
    }
  }, []);

  const handleMediaEnded = useCallback(() => {
    setPlaying(false);
    onPlayStateChange?.(false);
    onEnded?.();
  }, [onPlayStateChange, onEnded]);

  // ---------------------------------------------------------------------------
  // Control actions
  // ---------------------------------------------------------------------------

  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (playing) {
      media.pause();
    } else {
      media.play().catch(() => {});
    }
    const next = !playing;
    setPlaying(next);
    onPlayStateChange?.(next);
  }, [playing, onPlayStateChange]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const media = mediaRef.current;
      const track = seekRef.current;
      if (!media || !track || !duration) return;

      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      media.currentTime = fraction * duration;
      setCurrentTime(media.currentTime);
    },
    [duration],
  );

  const handleVolumeChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const media = mediaRef.current;
      const track = volumeRef.current;
      if (!media || !track) return;

      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      media.volume = fraction;
      setVolume(fraction);
      setIsMuted(fraction === 0);
    },
    [],
  );

  const toggleMute = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (isMuted) {
      media.volume = volume || 1;
      media.muted = false;
      setIsMuted(false);
      if (volume === 0) setVolume(1);
    } else {
      media.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const cycleSpeed = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    const idx = playbackSpeeds.indexOf(speed);
    const next = playbackSpeeds[(idx + 1) % playbackSpeeds.length];
    media.playbackRate = next;
    setSpeed(next);
  }, [speed]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  }, []);

  // Auto-hide controls for video
  useEffect(() => {
    if (!isVideo) return;
    let timer: ReturnType<typeof setTimeout>;
    const hide = () => {
      timer = setTimeout(() => {
        if (playing) setShowControls(false);
      }, 3000);
    };
    hide();
    return () => clearTimeout(timer);
  }, [isVideo, playing, showControls]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const volumeContainerStyle = useMemo(
    () => buildVolumeContainerStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  const volumeSliderStyle = useMemo(
    () => buildVolumeSliderStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );

  const speedBtnStyle = useMemo(
    () => buildSpeedButtonStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  const renderControls = () => (
    <div
      style={{
        ...controlBarStyle,
        ...(isVideo && !showControls
          ? { opacity: 0, transition: 'opacity 300ms ease' }
          : { opacity: 1, transition: 'opacity 300ms ease' }),
      }}
    >
      {/* Play/Pause */}
      <button
        type="button"
        onClick={togglePlay}
        style={controlBtnStyle}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <PauseIcon size={sizeConfig.iconSize} /> : <PlayIcon size={sizeConfig.iconSize} />}
      </button>

      {/* Seek bar (audio inline, video in controls) */}
      {isVideo && (
        <div ref={seekRef} style={seekContainerStyle} onClick={handleSeek}>
          <div style={seekTrackStyle}>
            <div style={seekFillStyle} />
          </div>
        </div>
      )}

      {/* Time */}
      {showTime && (
        <Text style={timeStyle}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>
      )}

      {/* Spacer for audio variant */}
      {!isVideo && <div style={{ flex: 1 }} />}

      {/* Volume */}
      {showVolume && (
        <div style={volumeContainerStyle}>
          <button
            type="button"
            onClick={toggleMute}
            style={controlBtnStyle}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeMuteIcon size={sizeConfig.iconSize} />
            ) : (
              <VolumeHighIcon size={sizeConfig.iconSize} />
            )}
          </button>
          <div ref={volumeRef} style={volumeSliderStyle} onClick={handleVolumeChange}>
            <div
              style={{
                ...buildSeekBarFillStyle(colors, isMuted ? 0 : volume),
                transition: 'width 100ms ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Speed */}
      {showSpeed && (
        <button
          type="button"
          onClick={cycleSpeed}
          style={speedBtnStyle}
          aria-label={`Playback speed: ${speed}x`}
        >
          {speed}x
        </button>
      )}

      {/* Fullscreen (video only) */}
      {isVideo && showFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          style={controlBtnStyle}
          aria-label="Fullscreen"
        >
          <FullscreenIcon size={sizeConfig.iconSize} />
        </button>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Video variant
  // ---------------------------------------------------------------------------

  if (isVideo) {
    const videoContainerStyle = buildVideoContainerStyle(theme);
    const videoElStyle = buildVideoElementStyle();

    return (
      <div
        ref={(el) => {
          containerRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        onMouseMove={handleMouseMove}
        {...rest}
      >
        <div style={videoContainerStyle} onClick={togglePlay}>
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            poster={poster}
            autoPlay={autoPlay}
            loop={loop}
            muted={initialMuted}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleMediaEnded}
            onPlay={() => { setPlaying(true); onPlayStateChange?.(true); }}
            onPause={() => { setPlaying(false); onPlayStateChange?.(false); }}
            style={videoElStyle}
            playsInline
          />
        </div>
        {renderControls()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Audio variant
  // ---------------------------------------------------------------------------

  const audioInfoStyle = useMemo(() => buildAudioInfoStyle(colors, theme), [colors, theme]);
  const audioSeekRowStyle = useMemo(() => buildAudioSeekRowStyle(sizeConfig), [sizeConfig]);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      {...rest}
    >
      <audio
        ref={mediaRef as React.RefObject<HTMLAudioElement>}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={initialMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleMediaEnded}
        onPlay={() => { setPlaying(true); onPlayStateChange?.(true); }}
        onPause={() => { setPlaying(false); onPlayStateChange?.(false); }}
        preload="metadata"
      />

      {/* Title / artist info */}
      {(title || artist) && (
        <div style={audioInfoStyle}>
          {title && (
            <Text style={{ fontSize: sizeConfig.fontSize + 2, fontWeight: defaultTypography.weights.semibold, color: colors.text }}>
              {title}
            </Text>
          )}
          {artist && (
            <Text style={{ fontSize: sizeConfig.fontSize, color: colors.textSecondary }}>
              {artist}
            </Text>
          )}
        </div>
      )}

      {/* Seek bar row */}
      <div style={audioSeekRowStyle}>
        {showTime && <Text style={timeStyle}>{formatTime(currentTime)}</Text>}
        <div ref={seekRef} style={{ ...seekContainerStyle, height: 24 }} onClick={handleSeek}>
          <div style={seekTrackStyle}>
            <div style={seekFillStyle} />
          </div>
        </div>
        {showTime && <Text style={timeStyle}>{formatTime(duration)}</Text>}
      </div>

      {/* Control bar */}
      {renderControls()}
    </div>
  );
});

MediaPlayer.displayName = 'MediaPlayer';
