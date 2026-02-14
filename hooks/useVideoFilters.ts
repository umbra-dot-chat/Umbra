/**
 * useVideoFilters — Applies lightweight CSS-based video filters using
 * CanvasRenderingContext2D.filter to process video frames in real time.
 */

import { useEffect, useRef, useState } from 'react';

export type VideoFilter = 'none' | 'grayscale' | 'sepia' | 'warm' | 'cool' | 'high-contrast';

export interface VideoFilterConfig {
  label: string;
  filter: string;
}

export const VIDEO_FILTERS: Record<VideoFilter, VideoFilterConfig> = {
  none: { label: 'None', filter: 'none' },
  grayscale: { label: 'Grayscale', filter: 'grayscale(100%)' },
  sepia: { label: 'Sepia', filter: 'sepia(80%)' },
  warm: { label: 'Warm', filter: 'saturate(130%) hue-rotate(-10deg)' },
  cool: { label: 'Cool', filter: 'saturate(110%) hue-rotate(180deg) brightness(1.1)' },
  'high-contrast': { label: 'High Contrast', filter: 'contrast(150%) brightness(1.05)' },
};

export interface UseVideoFiltersConfig {
  /** Source video stream */
  sourceStream: MediaStream | null;
  /** Current filter */
  filter: VideoFilter;
  /** Whether filtering is enabled */
  enabled?: boolean;
}

export interface UseVideoFiltersReturn {
  /** Processed output stream (or source if no filter) */
  outputStream: MediaStream | null;
  /** Whether filters are processing */
  isProcessing: boolean;
}

export function useVideoFilters(config: UseVideoFiltersConfig): UseVideoFiltersReturn {
  const { sourceStream, filter, enabled = true } = config;

  const [outputStream, setOutputStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sourceStream || !enabled || filter === 'none') {
      setOutputStream(sourceStream);
      setIsProcessing(false);
      return;
    }

    const videoTrack = sourceStream.getVideoTracks()[0];
    if (!videoTrack) {
      setOutputStream(sourceStream);
      setIsProcessing(false);
      return;
    }

    const settings = videoTrack.getSettings();
    const width = settings.width ?? 640;
    const height = settings.height ?? 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setOutputStream(sourceStream);
      setIsProcessing(false);
      return;
    }

    const video = document.createElement('video');
    video.srcObject = sourceStream;
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;

    const cssFilter = VIDEO_FILTERS[filter].filter;
    const capturedStream = canvas.captureStream(30);

    let active = true;

    const draw = () => {
      if (!active) return;
      ctx.filter = cssFilter;
      ctx.drawImage(video, 0, 0, width, height);
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    video
      .play()
      .then(() => {
        if (!active) return;
        setIsProcessing(true);
        setOutputStream(capturedStream);
        animationFrameIdRef.current = requestAnimationFrame(draw);
      })
      .catch(() => {
        if (!active) return;
        setOutputStream(sourceStream);
        setIsProcessing(false);
      });

    return () => {
      active = false;

      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }

      capturedStream.getTracks().forEach((track) => track.stop());

      canvasRef.current = null;

      setIsProcessing(false);
    };
  }, [sourceStream, filter, enabled]);

  return { outputStream, isProcessing };
}
