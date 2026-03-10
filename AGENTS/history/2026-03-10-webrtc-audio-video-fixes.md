# Session: 2026-03-10 — WebRTC Audio & Video Pipeline Fixes

## What Was Done

### Bug Fixes (All Deployed to 45.77.149.94)

1. **Audio backpressure** — FFmpeg was decoding MP3 faster than real-time, overflowing the ring buffer. Added `stdout.pause()` when buffer >80%, `resume()` when <50%.

2. **Video frame size mismatch** — `switchVideo()` kept `lastFrame` from old resolution. Added `this.lastFrame = null` in `switchVideo()`.

3. **Resolution cap bypass** — `cmdPlayVideo()` and `cmdNextVideo()` passed native resolution to `switchVideo()`. Added `Math.min(res, config.maxVideoWidth)` in all paths.

4. **System ffmpeg preference** — `resolveFfmpegPath()` now tries system ffmpeg first (has GPU/NVDEC), falls back to ffmpeg-static.

5. **Default resolution caps** — Set 720p@24fps defaults via `maxVideoWidth`, `maxVideoHeight`, `maxVideoFps` config fields.

### Infrastructure Created

6. **Real-pipeline loopback test** (`loopback-test.ts`) — Uses actual AudioSource/VideoSource with FFmpeg to test the FULL pipeline, not synthetic frames.

7. **HOW_CLAUDE_TESTS_VIDEO.md** — Comprehensive testing guide with known bugs, testing tools, and verification steps.

### Files Modified

```
packages/umbra-ghost-ai/src/media/audio-source.ts  — Backpressure, system ffmpeg
packages/umbra-ghost-ai/src/media/video-source.ts   — Backpressure, lastFrame clear, 720p defaults
packages/umbra-ghost-ai/src/handlers/call.ts         — Resolution caps in all command paths
packages/umbra-ghost-ai/src/config.ts                — maxVideoWidth/Height/Fps fields
packages/umbra-ghost-ai/src/loopback-test.ts         — New file: real-pipeline testing
plans/docs/HOW_CLAUDE_TESTS_VIDEO.md                 — New file: testing documentation
```

### Test Results (Production Server)

- Real-pipeline voice: **99.2/100**, 0 underruns, buffer stable at 2-4s
- Real-pipeline video (720p): **92.5/100**, 0 underruns, 0 dropped frames
- Real-pipeline video (1080p): **88.8/100** (tight but passing)
- Real-pipeline video (4K): **56.1/100 FAIL** (never use 4K)
- Log inspection: Clean, no errors

## Key Findings

- Synthetic tests scored 97/100 while production calls were completely broken. Real-pipeline tests are the only reliable indicator.
- FFmpeg decodes MP3 ~1000x faster than real-time. Without backpressure, the ring buffer fills in <100ms.
- The `@roamhq/wrtc` library requires samples/frames to have their own `ArrayBuffer` (not views into shared buffers).
- The NVIDIA A16-16Q GPU is used for FFmpeg decode (NVDEC) but wrtc does VP8 encoding in software.

## What's Next

- Wire developer settings (stats overlay, diagnostics) to actual functionality
- Fix AudioContext autoplay policy for audio-only calls (`ctx.resume()`)
- Data channel bidirectional communication (client → bot diagnostic config)
- Codec negotiation logging
