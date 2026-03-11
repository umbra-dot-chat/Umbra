/**
 * @module AudioWaveform
 * @description Visual waveform representation of audio data, commonly used
 * in chat apps and audio players. Supports bars, line, and mirrored variants
 * with playback progress and seek interaction.
 */

import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '../../providers';
import type { AudioWaveformProps } from '@coexist/wisp-core/types/AudioWaveform.types';
import { audioWaveformSizeMap } from '@coexist/wisp-core/types/AudioWaveform.types';
import {
  resolveAudioWaveformColors,
  buildAudioWaveformWrapperStyle,
  buildAudioWaveformSvgStyle,
  buildAudioWaveformSkeletonStyle,
  ensureAudioWaveformKeyframes,
} from '@coexist/wisp-core/styles/AudioWaveform.styles';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AudioWaveform = forwardRef<HTMLDivElement, AudioWaveformProps>(function AudioWaveform(
  {
    data,
    variant = 'bars',
    size = 'md',
    color = 'default',
    progress = 0,
    playing = false,
    responsive = false,
    skeleton = false,
    animated = false,
    onSeek,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = audioWaveformSizeMap[size];
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Inject animation keyframes if needed
  useEffect(() => {
    if (animated || playing) ensureAudioWaveformKeyframes();
  }, [animated, playing]);

  // Resolve colors
  const colors = useMemo(
    () => resolveAudioWaveformColors(color, theme),
    [color, theme],
  );

  // Skeleton early return
  if (skeleton) {
    const skeletonStyle = buildAudioWaveformSkeletonStyle(sizeConfig, responsive, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Bail if no data
  if (!data || data.length === 0) return null;

  // Styles
  const wrapperStyle = useMemo(
    () => buildAudioWaveformWrapperStyle(sizeConfig, responsive),
    [sizeConfig, responsive],
  );

  const svgStyle = useMemo(
    () => buildAudioWaveformSvgStyle(sizeConfig, responsive),
    [sizeConfig, responsive],
  );

  // Handle seek click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek) return;
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(fraction);
    },
    [onSeek],
  );

  // SVG dimensions
  const { width: svgW, height: svgH, barWidth, barGap, barMinHeight, barRadius } = sizeConfig;
  const barCount = data.length;
  const totalBarWidth = barCount * barWidth + (barCount - 1) * barGap;

  // Normalise data to 0–1 range if not already
  const normalised = useMemo(() => {
    const max = Math.max(...data, 0.01);
    return data.map((v) => Math.max(0, Math.min(1, v / max)));
  }, [data]);

  // Progress index (which bar the playback is at)
  const progressIndex = Math.floor(progress * barCount);

  // ---- Bars variant ----
  if (variant === 'bars') {
    const padding = 1;
    const usableW = svgW - padding * 2;
    const computedBarWidth = barCount > 0
      ? Math.max(1, (usableW - (barCount - 1) * barGap) / barCount)
      : barWidth;
    const maxBarH = svgH - padding * 2;

    return (
      <div
        ref={(el) => {
          wrapperRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className={className}
        style={{ ...wrapperStyle, cursor: onSeek ? 'pointer' : 'default', ...userStyle }}
        role="img"
        aria-label="Audio waveform"
        onClick={handleClick}
        {...rest}
      >
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={svgStyle}
          preserveAspectRatio="none"
        >
          {normalised.map((amp, i) => {
            const barH = Math.max(barMinHeight, amp * maxBarH);
            const x = padding + i * (computedBarWidth + barGap);
            const y = (svgH - barH) / 2;
            const isPlayed = i < progressIndex;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={computedBarWidth}
                height={barH}
                rx={Math.min(computedBarWidth / 2, barRadius)}
                fill={isPlayed ? colors.active : colors.inactive}
                style={
                  animated
                    ? {
                        transformOrigin: `${x + computedBarWidth / 2}px ${svgH / 2}px`,
                        animation: playing
                          ? `wisp-waveform-playing ${0.6 + Math.random() * 0.4}s ease-in-out ${i * 0.02}s infinite`
                          : `wisp-waveform-bar-rise 0.4s ease-out ${i * 0.015}s both`,
                      }
                    : playing
                      ? {
                          transformOrigin: `${x + computedBarWidth / 2}px ${svgH / 2}px`,
                          animation: `wisp-waveform-playing ${0.6 + Math.random() * 0.4}s ease-in-out ${i * 0.02}s infinite`,
                        }
                      : undefined
                }
              />
            );
          })}
        </svg>
      </div>
    );
  }

  // ---- Mirror variant ----
  if (variant === 'mirror') {
    const padding = 1;
    const usableW = svgW - padding * 2;
    const computedBarWidth = barCount > 0
      ? Math.max(1, (usableW - (barCount - 1) * barGap) / barCount)
      : barWidth;
    const halfH = svgH / 2;

    return (
      <div
        ref={(el) => {
          wrapperRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className={className}
        style={{ ...wrapperStyle, cursor: onSeek ? 'pointer' : 'default', ...userStyle }}
        role="img"
        aria-label="Audio waveform"
        onClick={handleClick}
        {...rest}
      >
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={svgStyle}
          preserveAspectRatio="none"
        >
          {normalised.map((amp, i) => {
            const barH = Math.max(barMinHeight / 2, amp * (halfH - padding));
            const x = padding + i * (computedBarWidth + barGap);
            const isPlayed = i < progressIndex;
            const fillColor = isPlayed ? colors.active : colors.inactive;

            return (
              <React.Fragment key={i}>
                {/* Top half */}
                <rect
                  x={x}
                  y={halfH - barH}
                  width={computedBarWidth}
                  height={barH}
                  rx={Math.min(computedBarWidth / 2, barRadius)}
                  fill={fillColor}
                  style={
                    animated
                      ? {
                          transformOrigin: `${x + computedBarWidth / 2}px ${halfH}px`,
                          animation: `wisp-waveform-bar-rise 0.4s ease-out ${i * 0.015}s both`,
                        }
                      : undefined
                  }
                />
                {/* Bottom half (mirrored) */}
                <rect
                  x={x}
                  y={halfH}
                  width={computedBarWidth}
                  height={barH}
                  rx={Math.min(computedBarWidth / 2, barRadius)}
                  fill={fillColor}
                  opacity={0.5}
                  style={
                    animated
                      ? {
                          transformOrigin: `${x + computedBarWidth / 2}px ${halfH}px`,
                          animation: `wisp-waveform-bar-rise 0.4s ease-out ${i * 0.015}s both`,
                        }
                      : undefined
                  }
                />
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    );
  }

  // ---- Line variant ----
  const padding = 2;
  const usableW = svgW - padding * 2;
  const stepX = barCount > 1 ? usableW / (barCount - 1) : 0;
  const halfH = svgH / 2;
  const maxAmp = halfH - padding;

  const points = useMemo(() => {
    return normalised.map((amp, i) => ({
      x: padding + i * stepX,
      y: halfH - amp * maxAmp,
    }));
  }, [normalised, stepX, halfH, maxAmp]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
  }, [points]);

  return (
    <div
      ref={(el) => {
        wrapperRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      className={className}
      style={{ ...wrapperStyle, cursor: onSeek ? 'pointer' : 'default', ...userStyle }}
      role="img"
      aria-label="Audio waveform"
      onClick={handleClick}
      {...rest}
    >
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={svgStyle}
        preserveAspectRatio="none"
      >
        {/* Inactive portion (full) */}
        <path
          d={pathD}
          stroke={colors.inactive}
          strokeWidth={sizeConfig.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Active (played) portion — clip to progress */}
        {progress > 0 && (
          <>
            <defs>
              <clipPath id="waveform-progress-clip">
                <rect x={0} y={0} width={padding + progress * usableW} height={svgH} />
              </clipPath>
            </defs>
            <path
              d={pathD}
              stroke={colors.active}
              strokeWidth={sizeConfig.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              clipPath="url(#waveform-progress-clip)"
            />
          </>
        )}
      </svg>
    </div>
  );
});

AudioWaveform.displayName = 'AudioWaveform';
