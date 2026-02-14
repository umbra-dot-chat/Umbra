/**
 * useVideoEffects — Canvas-based video background effects (blur, virtual backgrounds).
 *
 * Provides a processing pipeline that reads frames from a source MediaStream,
 * applies the selected effect on an offscreen canvas, and exposes a processed
 * output stream via `canvas.captureStream()`.
 *
 * The current implementation uses a simulated segmentation approach for the
 * virtual-background mode (simple overlay compositing). This can be swapped
 * for real ML-based body segmentation (e.g. TensorFlow.js BodyPix /
 * MediaPipe Selfie Segmentation) once those dependencies are added.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ───────────────────────────────────────────────────────────────

export type VideoEffect = 'none' | 'blur' | 'virtual-background';

export interface BackgroundPreset {
  id: string;
  name: string;
  thumbnail: string;
  url: string;
}

export interface UseVideoEffectsConfig {
  /** The source video stream to apply effects to */
  sourceStream: MediaStream | null;
  /** The current effect */
  effect: VideoEffect;
  /** Blur intensity (px) for blur mode */
  blurIntensity?: number;
  /** Background image URL for virtual-background mode */
  backgroundImage?: string | null;
  /** Whether effects processing is enabled */
  enabled?: boolean;
}

export interface UseVideoEffectsReturn {
  /** The processed output stream (or source if no effect) */
  outputStream: MediaStream | null;
  /** Whether effects are currently processing */
  isProcessing: boolean;
  /** Error if any */
  error: string | null;
  /** Available background presets */
  backgroundPresets: BackgroundPreset[];
}

// ── Background Presets ──────────────────────────────────────────────────

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'office', name: 'Office', thumbnail: '/backgrounds/office-thumb.jpg', url: '/backgrounds/office.jpg' },
  { id: 'nature', name: 'Nature', thumbnail: '/backgrounds/nature-thumb.jpg', url: '/backgrounds/nature.jpg' },
  { id: 'abstract', name: 'Abstract', thumbnail: '/backgrounds/abstract-thumb.jpg', url: '/backgrounds/abstract.jpg' },
  { id: 'gradient', name: 'Gradient', thumbnail: '/backgrounds/gradient-thumb.jpg', url: '/backgrounds/gradient.jpg' },
  { id: 'solid-dark', name: 'Solid Dark', thumbnail: '/backgrounds/solid-dark-thumb.jpg', url: '/backgrounds/solid-dark.jpg' },
  { id: 'solid-light', name: 'Solid Light', thumbnail: '/backgrounds/solid-light-thumb.jpg', url: '/backgrounds/solid-light.jpg' },
];

// ── Hook ────────────────────────────────────────────────────────────────

export function useVideoEffects(config: UseVideoEffectsConfig): UseVideoEffectsReturn {
  const {
    sourceStream,
    effect,
    blurIntensity = 10,
    backgroundImage = null,
    enabled = true,
  } = config;

  const [outputStream, setOutputStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for the offscreen canvas pipeline
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const offscreenCtxRef = useRef<OffscreenCanvasRenderingContext2D | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const capturedStreamRef = useRef<MediaStream | null>(null);

  // ── Load background image ──────────────────────────────────────────

  useEffect(() => {
    if (!backgroundImage) {
      backgroundImageRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      backgroundImageRef.current = img;
    };

    img.onerror = () => {
      console.warn('[useVideoEffects] Failed to load background image:', backgroundImage);
      backgroundImageRef.current = null;
    };

    img.src = backgroundImage;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [backgroundImage]);

  // ── Render loop ────────────────────────────────────────────────────

  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Prefer the OffscreenCanvas context for rendering; fall back to the
    // regular canvas context. The OffscreenCanvas runs compositing off the
    // main DOM, reducing layout/paint overhead.
    const offCtx = offscreenCtxRef.current;
    const mainCtx = ctxRef.current;
    const ctx = offCtx ?? mainCtx;

    if (!video || !canvas || !ctx || video.paused || video.ended) {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const videoW = video.videoWidth || 640;
    const videoH = video.videoHeight || 480;

    // Ensure canvas dimensions match the video
    if (canvas.width !== videoW || canvas.height !== videoH) {
      canvas.width = videoW;
      canvas.height = videoH;

      // Keep the OffscreenCanvas in sync
      const offCanvas = offscreenCanvasRef.current;
      if (offCanvas) {
        offCanvas.width = videoW;
        offCanvas.height = videoH;
      }
    }

    const width = canvas.width;
    const height = canvas.height;

    if (effect === 'blur') {
      // Apply blur filter to the entire frame
      ctx.filter = `blur(${blurIntensity}px)`;
      ctx.drawImage(video, 0, 0, width, height);
      ctx.filter = 'none';
    } else if (effect === 'virtual-background') {
      // Draw the background image (or a fallback solid color) first
      const bgImg = backgroundImageRef.current;
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, width, height);
      } else {
        // Fallback: dark background when no image is loaded
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
      }

      // Composite the video frame on top.
      //
      // NOTE: This is a placeholder compositing step. Without ML-based
      // body segmentation, we simply overlay the video with reduced
      // opacity so the background is partially visible. When a real
      // segmentation model is integrated, this should be replaced with
      // a masked draw that only renders the person pixels on top of the
      // background.
      ctx.globalAlpha = 0.85;
      ctx.drawImage(video, 0, 0, width, height);
      ctx.globalAlpha = 1.0;
    } else {
      // 'none' — should not reach here since we short-circuit, but
      // handle it gracefully just in case.
      ctx.drawImage(video, 0, 0, width, height);
    }

    // If we rendered to the OffscreenCanvas, blit the result to the main
    // canvas so captureStream() picks it up.
    if (offCtx && mainCtx && offscreenCanvasRef.current) {
      mainCtx.drawImage(offscreenCanvasRef.current, 0, 0);
    }

    animationFrameRef.current = requestAnimationFrame(renderFrame);
  }, [effect, blurIntensity]);

  // ── Pipeline setup / teardown ──────────────────────────────────────

  useEffect(() => {
    // If disabled or no source, pass through directly
    if (!enabled || !sourceStream || effect === 'none') {
      // Clean up any running pipeline
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }

      if (capturedStreamRef.current) {
        for (const track of capturedStreamRef.current.getTracks()) {
          track.stop();
        }
        capturedStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }

      setOutputStream(effect === 'none' ? sourceStream : null);
      setIsProcessing(false);
      setError(null);
      return;
    }

    // Set up the offscreen canvas pipeline
    let cancelled = false;

    const setup = async () => {
      try {
        setError(null);
        setIsProcessing(true);

        // Create a hidden video element to consume the source stream
        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.muted = true;
        video.srcObject = sourceStream;
        videoRef.current = video;

        await video.play();

        if (cancelled) return;

        // Create the main canvas (needed for captureStream())
        const canvas = document.createElement('canvas');
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        canvas.width = w;
        canvas.height = h;
        canvasRef.current = canvas;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Failed to get canvas 2D context');
          setIsProcessing(false);
          return;
        }
        ctxRef.current = ctx;

        // Performance optimisation: use an OffscreenCanvas for the
        // compositing / effect work when the API is available. This keeps
        // the heavy pixel manipulation off the main canvas and can be
        // promoted to a GPU-backed surface by the browser. The result is
        // blitted to the main HTMLCanvasElement each frame so that
        // captureStream() (which is only available on HTMLCanvasElement)
        // continues to work.
        if (typeof OffscreenCanvas !== 'undefined') {
          try {
            const offscreen = new OffscreenCanvas(w, h);
            const offCtx = offscreen.getContext('2d');
            if (offCtx) {
              offscreenCanvasRef.current = offscreen;
              offscreenCtxRef.current = offCtx;
            }
          } catch {
            // OffscreenCanvas 2d context not supported — fall back silently
            offscreenCanvasRef.current = null;
            offscreenCtxRef.current = null;
          }
        }

        // Capture the canvas as a MediaStream at 30 FPS
        const capturedStream = canvas.captureStream(30);
        capturedStreamRef.current = capturedStream;

        // Preserve audio tracks from the source stream
        for (const audioTrack of sourceStream.getAudioTracks()) {
          capturedStream.addTrack(audioTrack);
        }

        setOutputStream(capturedStream);

        // Start the render loop
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('[useVideoEffects] Pipeline setup failed:', message);
          setError(message);
          setIsProcessing(false);
          // Fall back to the unprocessed source stream
          setOutputStream(sourceStream);
        }
      }
    };

    setup();

    // Cleanup
    return () => {
      cancelled = true;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }

      if (capturedStreamRef.current) {
        for (const track of capturedStreamRef.current.getVideoTracks()) {
          track.stop();
        }
        capturedStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }

      canvasRef.current = null;
      ctxRef.current = null;
      offscreenCanvasRef.current = null;
      offscreenCtxRef.current = null;
      setIsProcessing(false);
    };
  }, [sourceStream, effect, enabled, renderFrame]);

  return {
    outputStream,
    isProcessing,
    error,
    backgroundPresets: BACKGROUND_PRESETS,
  };
}
