# How Claude Tests Video Calls (v2)

## Overview

This document outlines the autonomous testing process for validating Ghost AI's WebRTC video calling pipeline. Claude uses a layered testing approach:

1. **Real-pipeline loopback** (primary) — exercises the FULL FFmpeg+wrtc path
2. **Synthetic loopback** — tests wrtc encoding overhead in isolation
3. **Log inspection** — catches runtime errors invisible to frame-counting tests
4. **Client-side preview** — verifies UI renders without console errors

## Critical Lesson: Why Tests Must Match Production

Our initial tests scored 97/100 while actual calls were broken. The gap:

| What Tests Measured | What Production Did | Bug |
|---|---|---|
| Synthetic 440Hz frames | FFmpeg decoded MP3 to PCM | Ring buffer overflowed, audio data lost after 5s |
| Synthetic I420 frames | FFmpeg decoded 4K → 720p raw video | Frame size mismatches on video switch |
| Only initial video start | `cmdPlayVideo` changed video mid-call | No resolution caps on video commands |
| ffmpeg-static binary | System ffmpeg has GPU support | ffmpeg-static lacks NVDEC/NVENC |

**Rule: Always run `--real-pipeline` tests. Synthetic tests are supplementary only.**

## Testing Tools

### 1. `loopback-test.ts --real-pipeline` (PRIMARY TEST)

**What it tests:** The EXACT code path of a real call — AudioSource with FFmpeg decode, ring buffer, backpressure, VideoSource with FFmpeg decode, frame buffer, and wrtc encode/decode through two RTCPeerConnections.

**What it catches that synthetic tests miss:**
- Ring buffer overflow (audio data silently dropped by FFmpeg outpacing consumer)
- Backpressure failures (FFmpeg stdout not paused when buffer full)
- Frame size mismatches after video switching
- FFmpeg startup/decode delays
- Memory pressure from real frame allocation
- Audio underruns from event loop contention during video decode

**Usage:**
```bash
# On the production server (45.77.149.94)
cd /opt/ghost-ai

# Voice call — tests audio pipeline end-to-end
node dist/loopback-test.js --real-pipeline --type voice --duration 15 --media-dir ./data/media

# Video call — tests both audio + video pipeline
node dist/loopback-test.js --real-pipeline --type video --duration 15 --resolution 720p --media-dir ./data/media
```

**Scoring (100 points):**
- Audio delivery: 20pts (receiver frames vs expected)
- Audio health: 10pts (underrun count — catches ring buffer bugs)
- Video delivery: 20pts (receiver frames vs expected)
- Video health: 10pts (dropped frames — catches buffer overflow)
- Audio timing: 15pts (consistency of 10ms intervals at receiver)
- Video timing: 15pts (consistency of frame intervals)
- Feed timer accuracy: 10pts (sender-side timing alerts)

**Pass threshold:** 70/100

**Key metrics to watch:**
- `underruns: 0` — any underruns indicate audio pipeline bug
- `drops: 0` — any drops indicate video buffer overflow
- `buf=2000-4000ms` — audio buffer should be 2-4 seconds, not 0 or 5000
- `buf=30-50/0.5-0.8` — video buffer should be 50-80% full

### 2. `loopback-test.ts` (Synthetic — Supplementary)

**What it tests:** wrtc encoding/decoding overhead only, using generated test frames.

**When to use:** Quick check that wrtc encoding can keep up at a given resolution. Does NOT test FFmpeg pipeline, ring buffer, or backpressure.

```bash
node dist/loopback-test.js --type video --duration 15 --resolution 720p
node dist/loopback-test.js --type video --duration 15 --resolution 1080p  # stress test
```

### 3. Log Inspection (CRITICAL)

**Server logs catch errors invisible to frame-counting tests.** Always check after deploying:

```bash
# Check for frame errors, buffer overflows, FFmpeg failures
ssh root@45.77.149.94 "journalctl -u ghost-en --no-pager -n 200 | \
  grep -E 'ERROR|WARN|overflow|underrun|drop|Frame feed error|byteLength'"
```

**Known error patterns to look for:**
- `Frame feed error: TypeError: Expected a .byteLength of X, not Y` — resolution mismatch between frame data and declared width/height. Caused by switchVideo() not clearing lastFrame, or cmdPlayVideo() not capping resolution.
- `Ring buffer overflow: dropped N bytes` — FFmpeg producing faster than consumer reads. Fixed by backpressure, but could regress.
- `GPU acceleration not available` — ffmpeg-static being used instead of system ffmpeg. Check `resolveFfmpegPath()`.
- `ICE connection state: failed` — network/TURN issue, not a media bug.

### 4. `DegradationDetector` (Runtime Monitor)

- Records audio/video metrics at 100ms resolution for first 60 seconds
- Alerts on: underruns, RMS spikes, frame drift, low buffer health
- Reports via data channel to client stats overlay

### 5. `RawMediaCapture` (Post-Mortem)

- Toggle during calls: `{ type: 'diagnostic-config', settings: { rawMediaCapture: true } }`
- Captures raw PCM/I420 to disk. Heavy I/O, disabled by default.

## Test Process

### Step 1: Pre-Deployment

```bash
cd packages/umbra-ghost-ai

# 1. Type-check
npx tsc --noEmit

# 2. Build
npx tsc
```

### Step 2: Deploy

```bash
# 1. Sync dist to server
rsync -avz dist/ root@45.77.149.94:/opt/ghost-ai/dist/

# 2. Restart service
ssh root@45.77.149.94 "systemctl restart ghost-en"

# 3. Verify startup (check for errors)
ssh root@45.77.149.94 "sleep 2 && journalctl -u ghost-en --no-pager -n 15"
```

### Step 3: Run Real-Pipeline Tests (REQUIRED)

```bash
# Voice test — MUST pass, catches audio garbling
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type voice --duration 15 --media-dir ./data/media"

# Video test — MUST pass, catches choppy video
ssh root@45.77.149.94 "cd /opt/ghost-ai && \
  node dist/loopback-test.js --real-pipeline --type video --duration 15 --media-dir ./data/media"
```

**Both tests must score >= 80 with 0 underruns and 0 dropped frames.**

### Step 4: Check Logs for Hidden Errors

```bash
ssh root@45.77.149.94 "journalctl -u ghost-en --no-pager --since '5 min ago' | \
  grep -E 'ERROR|WARN|overflow|underrun|byteLength|drop'"
```

**Must return empty.** Any matches indicate a bug the loopback test didn't catch.

### Step 5: Client Preview Verification

```bash
# Check preview app renders, no console errors
# Limitation: preview can't make real calls (no getUserMedia permission)
```

### Step 6: Live Call Verification

```bash
# Monitor bot logs during a real call:
ssh root@45.77.149.94 "journalctl -u ghost-en -f"
```

Look for:
- `Starting video: ... (1280x720@24fps)` — resolution cap applied
- `NVIDIA GPU acceleration available` — system ffmpeg with NVDEC
- `Pre-buffer filled` — both audio and video pre-buffered
- No `Frame feed error` messages
- No `Ring buffer overflow` messages

## Known Bugs Fixed

### 1. Audio Garbling After 5 Seconds
**Root cause:** Ring buffer (5 sec / 480KB) filled instantly because FFmpeg decodes MP3 orders of magnitude faster than real-time. Once full, `write()` returned 0 and all subsequent audio data was silently dropped. After the 5-second buffer drained, audio became garbled/silent.
**Fix:** Added backpressure — pause FFmpeg stdout when ring buffer >80% full, resume when <50%.

### 2. Video Frame Size Mismatch on Switch
**Root cause:** `switchVideo()` cleared the frame buffer but kept `lastFrame` from the old resolution. During pre-buffering, `feedFrame()` fell back to `lastFrame`, and wrtc rejected it: `Expected a .byteLength of 12441600, not 1382400`.
**Fix:** Clear `lastFrame = null` in `switchVideo()`.

### 3. Video Commands Bypassed Resolution Caps
**Root cause:** `cmdPlayVideo()` and `cmdNextVideo()` passed native resolution (e.g., 3840x2160) to `switchVideo()` without applying `maxVideoWidth`/`maxVideoHeight` caps.
**Fix:** Apply `Math.min(res, config.maxVideoWidth)` in all command paths.

### 4. ffmpeg-static Lacks GPU Support
**Root cause:** `ffmpeg-static` is statically compiled without CUDA libraries. The NVDEC GPU detection test used the same binary, so GPU was always "not available" despite the A16 GPU being present.
**Fix:** Prefer system `ffmpeg` (which has CUDA support) over ffmpeg-static.

## Architecture: The Media Pipeline

```
FFmpeg decode (GPU/CPU)
    |
    v
stdout pipe (raw I420/PCM)
    |
    v (backpressure: pause when buffer >80%, resume <50%)
    |
Ring Buffer (audio, 5s)  /  Frame Buffer (video, 60 frames)
    |
    v (drift-compensating setTimeout, not setInterval)
    |
RTCAudioSource.onData()  /  RTCVideoSource.onFrame()
    |
    v (wrtc internal software VP8/H264 + Opus encoding)
    |
RTP over DTLS-SRTP → network → client browser
```

## Config Reference

| Env Var | Default | Description |
|---------|---------|-------------|
| `MAX_VIDEO_WIDTH` | 1280 | Max video width for WebRTC encoding |
| `MAX_VIDEO_HEIGHT` | 720 | Max video height |
| `MAX_VIDEO_FPS` | 24 | Max video FPS |
| `GHOST_DIAG_FRAME_TIMING` | true | Enable frame timing alerts |
| `GHOST_DIAG_DEGRADATION` | true | Enable degradation detection |
| `GHOST_DIAG_RAW_CAPTURE` | false | Enable raw media capture (heavy I/O) |
