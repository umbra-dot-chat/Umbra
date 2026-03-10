# Domain: WebRTC Media Pipeline (Ghost AI)

## Package Location

`packages/umbra-ghost-ai/` — Node.js bot running on GPU server at 45.77.149.94

## The Pipeline (Memorize This)

```
FFmpeg decode (NVDEC GPU or CPU)
    │
    ▼
stdout pipe (raw I420 video / PCM audio)
    │
    ▼ BACKPRESSURE: pause() when buffer >80%, resume() when <50%
    │
Ring Buffer (audio, 5s/480KB)  ╱  Frame Buffer (video, 60 frames)
    │
    ▼ drift-compensating setTimeout (NOT setInterval)
    │
RTCAudioSource.onData()  ╱  RTCVideoSource.onFrame()
    │
    ▼ @roamhq/wrtc software VP8/H264 + Opus encoding
    │
RTP over DTLS-SRTP → network → client browser
```

## Critical Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/media/audio-source.ts` | Audio pipeline: FFmpeg → ring buffer → wrtc | `feedFrame()`, `startDecoding()`, `resolveFfmpegPath()` |
| `src/media/video-source.ts` | Video pipeline: FFmpeg → frame buffer → wrtc | `feedFrame()`, `switchVideo()`, `startDecoding()` |
| `src/handlers/call.ts` | Call lifecycle, connects audio/video sources | `createVideoTrack()`, `cmdPlayVideo()`, `cmdNextVideo()` |
| `src/config.ts` | Resolution caps, diagnostic flags | `maxVideoWidth`, `maxVideoHeight`, `maxVideoFps` |
| `src/loopback-test.ts` | Real-pipeline loopback testing | `--real-pipeline`, `--type voice|video` |

## Bugs We've Fixed (and WHY They Happened)

### 1. Audio Garbles After 5 Seconds

**The trap:** FFmpeg decodes MP3 orders of magnitude faster than real-time. A 30-second MP3 decodes in <100ms. The 480KB ring buffer fills instantly. `write()` returns 0. All subsequent audio data is silently dropped. You hear 5 seconds of buffered audio, then garbage.

**The fix:** Backpressure. `ffmpegProcess.stdout.pause()` when ring buffer >80% full. `.resume()` when <50%. This throttles FFmpeg to match real-time consumption.

**How to detect:** `--real-pipeline` voice test. Watch for `underruns > 0` or buffer draining to 0.

### 2. Video Frame Size Mismatch on Switch

**The trap:** `switchVideo()` clears the frame buffer but NOT `lastFrame`. During the gap before the new video's first frame arrives, `feedFrame()` falls back to `lastFrame` — which has a different `byteLength` than the new declared resolution. wrtc throws: `Expected a .byteLength of 12441600, not 1382400`.

**The fix:** `this.lastFrame = null` in `switchVideo()`. If no frame is ready, `feedFrame()` skips instead of using stale data.

**How to detect:** `journalctl | grep byteLength`.

### 3. Commands Bypass Resolution Caps

**The trap:** `cmdPlayVideo()` and `cmdNextVideo()` in call.ts pass the video's native resolution directly to `switchVideo()`. A 4K video (3840x2160) gets passed through, overwhelming the encoder. The caps in `createVideoTrack()` only apply at call start.

**The fix:** `Math.min(nativeRes, config.maxVideoWidth)` in ALL paths that call `switchVideo()`.

**How to detect:** `journalctl | grep "Starting video"` — resolution should never exceed 1280x720.

### 4. ffmpeg-static Has No GPU

**The trap:** The npm package `ffmpeg-static` is compiled without CUDA. It silently falls back to CPU decode. Meanwhile the NVIDIA A16-16Q sits idle.

**The fix:** `resolveFfmpegPath()` tries system `ffmpeg` first (`which ffmpeg`), falls back to ffmpeg-static only if system binary isn't found.

**How to detect:** Look for `NVIDIA GPU acceleration available` in startup logs.

## wrtc API Notes (@roamhq/wrtc)

This is NOT standard browser WebRTC. Key differences:

- `RTCAudioSource` / `RTCVideoSource` — for injecting raw media (server-side only)
- `RTCAudioSink` / `RTCVideoSink` — for capturing received media (used in loopback tests)
- Audio frames: `{ samples: Int16Array, sampleRate: 48000, bitsPerSample: 16, channelCount: 1 }`
- Video frames: `{ data: Buffer, width: number, height: number }` — raw I420 format
- `samples` must have its own `ArrayBuffer` — can't be a view into a larger buffer

## Resolution & Performance Limits

On the 6-core Broadwell + A16 GPU server:

| Resolution | FPS | Raw Throughput | Loopback Score | Verdict |
|-----------|-----|----------------|----------------|---------|
| 720p | 24 | ~37 MB/s | 92.5/100 | Default, recommended |
| 1080p | 30 | ~93 MB/s | 88.8/100 | Possible, tight margin |
| 4K | 30 | ~746 MB/s | 56.1/100 FAIL | Never use |

## Testing WebRTC Changes

See `AGENTS/TESTING_PLAYBOOK.md` for the full test sequence. The short version:

1. Type-check: `npx tsc --noEmit`
2. Build: `npx tsc`
3. Deploy: `rsync` + `systemctl restart`
4. Real-pipeline voice test: must score >= 80, 0 underruns
5. Real-pipeline video test: must score >= 80, 0 drops
6. Log inspection: must be clean
