/**
 * useVideoEffects — Canvas-based video background effects (blur, virtual backgrounds).
 *
 * Uses MediaPipe's ImageSegmenter (selfie segmentation model) to separate
 * the person from the background in real-time. The segmentation mask is then
 * used to:
 *   - blur ONLY the background (not the person) for "blur" mode
 *   - replace the background with a custom image for "virtual-background" mode
 *
 * Works in both Chrome and Safari (no dependency on ctx.filter).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  bgOffice, bgNature, bgAbstract, bgGradient,
  bgSolidDark, bgSolidLight, bgBeach, bgCity,
} from '../../assets/backgrounds';

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

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'office',      name: 'Office',      thumbnail: bgOffice,    url: bgOffice },
  { id: 'nature',      name: 'Nature',      thumbnail: bgNature,    url: bgNature },
  { id: 'abstract',    name: 'Abstract',    thumbnail: bgAbstract,  url: bgAbstract },
  { id: 'gradient',    name: 'Gradient',    thumbnail: bgGradient,  url: bgGradient },
  { id: 'beach',       name: 'Beach',       thumbnail: bgBeach,     url: bgBeach },
  { id: 'city',        name: 'City',        thumbnail: bgCity,      url: bgCity },
  { id: 'solid-dark',  name: 'Solid Dark',  thumbnail: bgSolidDark, url: bgSolidDark },
  { id: 'solid-light', name: 'Solid Light', thumbnail: bgSolidLight,url: bgSolidLight },
];

// ── MediaPipe CDN URLs ──────────────────────────────────────────────────

const MEDIAPIPE_WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';

const SELFIE_SEGMENTER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

// ── Stack Blur ──────────────────────────────────────────────────────────

/**
 * Fast O(w*h) box blur approximation (two-pass: horizontal + vertical).
 * Does NOT rely on `ctx.filter` — works in Safari and all browsers.
 */
function stackBlurImageData(imageData: ImageData, radius: number): void {
  const w = imageData.width;
  const h = imageData.height;
  const pixels = imageData.data;

  if (radius < 1) return;
  radius = Math.min(radius, 255) | 0;

  const div = 2 * radius + 1;

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    let rSum = 0, gSum = 0, bSum = 0;
    const yOff = y * w * 4;
    for (let i = -radius; i <= radius; i++) {
      const x = Math.min(Math.max(i, 0), w - 1);
      const off = yOff + x * 4;
      rSum += pixels[off];
      gSum += pixels[off + 1];
      bSum += pixels[off + 2];
    }
    for (let x = 0; x < w; x++) {
      const off = yOff + x * 4;
      pixels[off]     = (rSum / div) | 0;
      pixels[off + 1] = (gSum / div) | 0;
      pixels[off + 2] = (bSum / div) | 0;

      const addX = Math.min(x + radius + 1, w - 1);
      const subX = Math.max(x - radius, 0);
      const addOff = yOff + addX * 4;
      const subOff = yOff + subX * 4;
      rSum += pixels[addOff]     - pixels[subOff];
      gSum += pixels[addOff + 1] - pixels[subOff + 1];
      bSum += pixels[addOff + 2] - pixels[subOff + 2];
    }
  }

  // Vertical pass
  for (let x = 0; x < w; x++) {
    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = -radius; i <= radius; i++) {
      const y = Math.min(Math.max(i, 0), h - 1);
      const off = (y * w + x) * 4;
      rSum += pixels[off];
      gSum += pixels[off + 1];
      bSum += pixels[off + 2];
    }
    for (let y = 0; y < h; y++) {
      const off = (y * w + x) * 4;
      pixels[off]     = (rSum / div) | 0;
      pixels[off + 1] = (gSum / div) | 0;
      pixels[off + 2] = (bSum / div) | 0;

      const addY = Math.min(y + radius + 1, h - 1);
      const subY = Math.max(y - radius, 0);
      const addOff = (addY * w + x) * 4;
      const subOff = (subY * w + x) * 4;
      rSum += pixels[addOff]     - pixels[subOff];
      gSum += pixels[addOff + 1] - pixels[subOff + 1];
      bSum += pixels[addOff + 2] - pixels[subOff + 2];
    }
  }
}

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

  // Refs for the canvas pipeline
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const capturedStreamRef = useRef<MediaStream | null>(null);

  // MediaPipe segmenter (persists across pipeline restarts)
  const segmenterRef = useRef<any>(null);
  const segmenterReadyRef = useRef(false);

  // Config refs — render loop reads without causing pipeline rebuild
  const effectRef = useRef<VideoEffect>(effect);
  const blurIntensityRef = useRef<number>(blurIntensity);
  effectRef.current = effect;
  blurIntensityRef.current = blurIntensity;

  const needsPipeline = enabled && !!sourceStream && effect !== 'none';

  // ── Load background image ──────────────────────────────────────────

  useEffect(() => {
    if (!backgroundImage) {
      backgroundImageRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { backgroundImageRef.current = img; };
    img.onerror = () => {
      console.warn('[useVideoEffects] Failed to load background image:', backgroundImage);
      backgroundImageRef.current = null;
    };
    img.src = backgroundImage;

    return () => { img.onload = null; img.onerror = null; };
  }, [backgroundImage]);

  // ── Render loop ────────────────────────────────────────────────────
  // Uses MediaPipe segmentation mask to separate person from background.
  //   blur mode: blurs only background pixels via stack blur
  //   virtual-background: composites person over custom image

  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const segmenter = segmenterRef.current;

    if (!video || !canvas || !ctx || video.paused || video.ended) {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const videoW = video.videoWidth || 640;
    const videoH = video.videoHeight || 480;

    if (canvas.width !== videoW || canvas.height !== videoH) {
      canvas.width = videoW;
      canvas.height = videoH;
    }

    const width = canvas.width;
    const height = canvas.height;
    const currentEffect = effectRef.current;
    const currentBlur = blurIntensityRef.current;

    // If segmenter is not ready, draw raw video
    if (!segmenter || !segmenterReadyRef.current) {
      ctx.drawImage(video, 0, 0, width, height);
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    // Run segmentation
    let mask: Float32Array | null = null;
    try {
      const result = segmenter.segmentForVideo(video, performance.now());
      if (result.confidenceMasks && result.confidenceMasks.length > 0) {
        mask = result.confidenceMasks[0].getAsFloat32Array();
      }
    } catch {
      // Segmentation failed — draw raw
      ctx.drawImage(video, 0, 0, width, height);
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    if (!mask) {
      ctx.drawImage(video, 0, 0, width, height);
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    if (currentEffect === 'blur') {
      // 1. Draw full video frame to get raw pixel data
      ctx.drawImage(video, 0, 0, width, height);
      const originalData = ctx.getImageData(0, 0, width, height);

      // 2. Create a blurred copy
      const blurredData = new ImageData(
        new Uint8ClampedArray(originalData.data),
        width,
        height,
      );
      stackBlurImageData(blurredData, Math.max(1, Math.round(currentBlur * 0.8)));

      // 3. Composite: person = original, background = blurred
      const orig = originalData.data;
      const blur = blurredData.data;

      for (let i = 0; i < mask.length; i++) {
        // mask[i]: 1.0 = person, 0.0 = background
        const p = mask[i];
        const b = 1.0 - p;
        const px = i * 4;
        orig[px]     = orig[px]     * p + blur[px]     * b;
        orig[px + 1] = orig[px + 1] * p + blur[px + 1] * b;
        orig[px + 2] = orig[px + 2] * p + blur[px + 2] * b;
      }

      ctx.putImageData(originalData, 0, 0);
    } else if (currentEffect === 'virtual-background') {
      // 1. Draw background first
      const bgImg = backgroundImageRef.current;
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
      }
      const bgData = ctx.getImageData(0, 0, width, height);

      // 2. Draw video to get person pixels
      ctx.drawImage(video, 0, 0, width, height);
      const vidData = ctx.getImageData(0, 0, width, height);

      // 3. Composite: person from video, background from bgData
      const bg = bgData.data;
      const vid = vidData.data;

      for (let i = 0; i < mask.length; i++) {
        const p = mask[i];
        const b = 1.0 - p;
        const px = i * 4;
        vid[px]     = vid[px]     * p + bg[px]     * b;
        vid[px + 1] = vid[px + 1] * p + bg[px + 1] * b;
        vid[px + 2] = vid[px + 2] * p + bg[px + 2] * b;
      }

      ctx.putImageData(vidData, 0, 0);
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    animationFrameRef.current = requestAnimationFrame(renderFrame);
  }, []); // Stable — reads config from refs

  // ── Pipeline setup / teardown ──────────────────────────────────────

  useEffect(() => {
    if (!needsPipeline) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
      if (capturedStreamRef.current) {
        for (const track of capturedStreamRef.current.getVideoTracks()) track.stop();
        capturedStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
      canvasRef.current = null;
      ctxRef.current = null;

      setOutputStream(sourceStream && enabled ? sourceStream : null);
      setIsProcessing(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const setup = async () => {
      try {
        setError(null);
        setIsProcessing(true);

        // 1. Initialize MediaPipe segmenter (once — persisted in ref)
        if (!segmenterRef.current) {
          try {
            const { FilesetResolver, ImageSegmenter } = await import(
              '@mediapipe/tasks-vision'
            );

            const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_CDN);
            if (cancelled) return;

            const segmenter = await ImageSegmenter.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: SELFIE_SEGMENTER_MODEL,
                delegate: 'GPU',
              },
              outputConfidenceMasks: true,
              outputCategoryMask: false,
              runningMode: 'VIDEO',
            });

            if (cancelled) { segmenter.close(); return; }

            segmenterRef.current = segmenter;
            segmenterReadyRef.current = true;
            console.info('[useVideoEffects] MediaPipe selfie segmenter ready');
          } catch (segErr) {
            console.warn('[useVideoEffects] MediaPipe init failed, effects will show raw video:', segErr);
            segmenterReadyRef.current = false;
          }
        }

        if (cancelled) return;

        // 2. Hidden video element
        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.muted = true;
        video.srcObject = sourceStream;
        videoRef.current = video;

        await video.play();
        if (cancelled) return;

        // 3. Main canvas
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

        // 4. Capture stream
        if (typeof canvas.captureStream !== 'function') {
          console.warn('[useVideoEffects] captureStream not supported');
          setOutputStream(sourceStream);
          setIsProcessing(false);
          return;
        }
        const capturedStream = canvas.captureStream(30);
        capturedStreamRef.current = capturedStream;

        if (sourceStream) {
          for (const audioTrack of sourceStream.getAudioTracks()) {
            capturedStream.addTrack(audioTrack);
          }
        }

        setOutputStream(capturedStream);

        // 5. Start render loop
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('[useVideoEffects] Pipeline setup failed:', message);
          setError(message);
          setIsProcessing(false);
          setOutputStream(sourceStream);
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
      if (capturedStreamRef.current) {
        for (const track of capturedStreamRef.current.getVideoTracks()) track.stop();
        capturedStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
      canvasRef.current = null;
      ctxRef.current = null;
      setIsProcessing(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceStream, needsPipeline, renderFrame]);

  // Cleanup segmenter on full unmount
  useEffect(() => {
    return () => {
      if (segmenterRef.current) {
        try { segmenterRef.current.close(); } catch { /* ignore */ }
        segmenterRef.current = null;
        segmenterReadyRef.current = false;
      }
    };
  }, []);

  return {
    outputStream,
    isProcessing,
    error,
    backgroundPresets: BACKGROUND_PRESETS,
  };
}
