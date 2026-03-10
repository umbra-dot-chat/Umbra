# Video & Audio Diagnostics — Investigation & Implementation Plan

> **Created:** 2026-03-10
> **Status:** Approved — ready for implementation
> **Priority:** All tracks in parallel

---

## Executive Summary

Three interrelated bugs exist in Umbra's WebRTC media pipeline between the Ghost AI bot and the client:

1. **Video plays at super-fast speed** — frames arrive in bursts instead of at a steady cadence
2. **Audio clear then garbled** — audio plays correctly for a few seconds, then degrades
3. **Audio-only calls are silent** — remote party audio never plays on voice-only calls (video calls work fine)

This plan covers root cause analysis, diagnostic tooling, test infrastructure, and fixes.

---

## Architecture Overview

### Bot-Side Media Pipeline

```
FFmpeg (decode)
    ├── Video: raw I420 (YUV420P) → frame buffer → setInterval(33.3ms) → RTCVideoSource.onFrame()
    └── Audio: raw PCM s16le 48kHz mono → ring buffer → setInterval(10ms) → RTCAudioSource.onData()
                                                                              ↓
                                                                        wrtc encodes (VP8/H264 + Opus)
                                                                              ↓
                                                                        RTP over DTLS-SRTP
```

### Client-Side Media Pipeline

```
RTCPeerConnection.ontrack
    ↓
remoteStream (MediaStream with audio + video tracks)
    ├── Video calls: <video srcObject={stream}> plays both audio & video
    └── Audio-only calls: *** NO PLAYBACK ELEMENT *** (BUG #3)
```

### Key Files

| Component | Path |
|---|---|
| Bot Audio Source | `packages/umbra-ghost-ai/src/media/audio-source.ts` |
| Bot Video Source | `packages/umbra-ghost-ai/src/media/video-source.ts` |
| Bot Call Handler | `packages/umbra-ghost-ai/src/handlers/call.ts` |
| Client CallManager | `src/services/CallManager.ts` |
| Client CallContext | `src/contexts/CallContext.tsx` |
| Client ActiveCallPanel | `src/components/call/ActiveCallPanel.tsx` |
| Stats Overlay | `src/components/call/CallStatsOverlay.tsx` |
| Settings Dialog | `src/components/modals/SettingsDialog.tsx` |

---

## Bug #1: Video Plays at Super-Fast Speed

### Root Cause Analysis

**Most likely cause: `setInterval` drift and burst delivery.**

The bot feeds video frames using `setInterval(() => feedFrame(), 1000/fps)` (~33.3ms for 30fps). Node.js `setInterval` has well-documented limitations:

- **Event loop blocking:** FFmpeg decode, GC pauses, or other I/O can delay the timer callback
- **Timer coalescing:** When delayed, multiple callbacks can fire in rapid succession
- **No drift compensation:** Each interval is relative to the *last fire*, not absolute wall-clock time

When frames accumulate in the buffer and the interval catches up, `wrtc` receives a burst of frames. The `wrtc` library assigns RTP timestamps based on when `onFrame()` is called, so burst delivery = compressed timestamps = fast playback on the client.

### Diagnostic Approach

1. **High-resolution timing measurement** using `process.hrtime.bigint()` (nanosecond precision)
2. **Strict >5ms drift threshold** — flag any interval exceeding ±5ms from target
3. **Intercept wrtc internals** to log outgoing RTP timestamps per frame
4. **A/V sync validation** using all three methods:
   - Visual frame counter + audio click track
   - Bot-side timestamp logging for both audio and video
   - Data channel timestamps compared with client playback position

### Fix Strategy

**Replace `setInterval` with a native addon using nanosleep** for sub-millisecond timer accuracy. This eliminates event-loop-dependent timing and ensures steady frame pacing regardless of other Node.js activity.

Implementation:
- Use a native N-API addon wrapping `clock_nanosleep()` (Linux) or `mach_wait_until()` (macOS)
- Feed loop runs in a dedicated thread, posts frames to the main thread via `napi_threadsafe_function`
- Fallback to `setTimeout` with drift compensation if native addon is unavailable

---

## Bug #2: Audio Clear Then Garbled

### Root Cause Analysis

Audio uses the same `setInterval` pattern at 10ms intervals (480 PCM samples per frame at 48kHz). Potential causes:

- **Ring buffer state divergence** — read/write pointers desync under timing pressure
- **Buffer underrun recovery** — after underruns (silence frames), the ring buffer read position may skip or repeat data
- **FFmpeg decode burst** — large chunks arrive from FFmpeg stdout, partially filling the ring buffer mid-read
- **Crossfade corruption** — loop restart crossfade logic may produce invalid samples

### Diagnostic Approach

1. **Ring buffer state logging every frame** — log `available`, `readPos`, `writePos`, `underrunCount` at each `feedFrame()` call
2. **Raw PCM `.wav` dump** at the feed-in point (pre-wrtc) for offline spectral analysis
3. **PESQ quality scoring** against a 440Hz reference sine wave to objectively measure degradation
4. **Time-series logging at 100ms resolution** for the first 60 seconds of each call
5. **Threshold-triggered state snapshots** when metrics cross degradation thresholds
6. **Raw media ring buffer rewind** — keep last N seconds of raw media for "capture on degradation"

### Fix Strategy

Same native timer addon as Bug #1 will fix timing-related garble. Additional:
- Add ring buffer integrity checks (read should never overtake write)
- Guard crossfade logic against partial buffer states
- Add a "garble detector" using per-frame RMS energy monitoring

---

## Bug #3: Audio-Only Calls — Can't Hear Remote Party

### Root Cause (Confirmed)

**The client has no audio playback element for voice-only calls.**

In video calls, the `<video>` element in `VideoTile` plays both video and audio tracks from the remote `MediaStream`. In audio-only calls, `VideoTile` is not rendered (the UI shows just caller name + timer), so the remote audio track has nowhere to play.

The Web Audio API path in `CallContext.tsx` (lines 598-631) *exists* but may not reliably activate without a DOM element source.

### Fix Strategy

**Web Audio API only** — create an `AudioContext` → `MediaStreamSource` → `GainNode` → `destination` chain directly from the `remoteStream`, independent of any DOM element. This works for both audio-only and video calls and provides volume control.

```typescript
// In CallContext.tsx useEffect:
const ctx = new AudioContext();
const source = ctx.createMediaStreamSource(remoteStream);
const gain = ctx.createGain();
gain.gain.value = volume / 100;
source.connect(gain);
gain.connect(ctx.destination);
```

### Verification

- Check `RTCPeerConnection.getStats()` for inbound-rtp audio track `bytesReceived > 0`
- Confirm `AudioContext.state === 'running'` (not suspended by autoplay policy)

---

## Diagnostic Tooling Specification

### 1. Frame Timing Monitor (Bot-Side)

**File:** `packages/umbra-ghost-ai/src/media/timing-monitor.ts`

```
Capabilities:
- process.hrtime.bigint() nanosecond-precision interval measurement
- Strict >5ms drift alert threshold
- Per-frame jitter histogram
- Burst detection (3+ frames delivered within 5ms)
- Always-on with lightweight overhead
- Detailed capture togglable via diagnostics setting
```

### 2. Ring Buffer State Logger (Bot-Side)

**File:** Extended in `packages/umbra-ghost-ai/src/media/audio-source.ts`

```
Capabilities:
- Per-frame state snapshot: available bytes, readPos, writePos, underruns
- Integrity checks: detect read overtaking write
- Degradation threshold triggers
- Exports to structured JSON log via data channel
```

### 3. Raw Media Capture (Bot-Side)

**File:** `packages/umbra-ghost-ai/src/media/capture.ts`

```
Capabilities:
- Tee raw PCM to .wav files before feeding to wrtc
- Tee raw I420 to .yuv files before feeding to wrtc
- Lossless format for exact representation
- Togglable via diagnostics setting (heavy I/O)
- Auto-cleanup after configurable retention period
```

### 4. Reference Signal Generator (Bot-Side)

**File:** `packages/umbra-ghost-ai/src/media/test-signal.ts`

```
Capabilities:
- 440Hz sine wave generation (pure tone)
- Configurable duration and amplitude
- Feeds directly to RTCAudioSource bypassing FFmpeg
- Used by ghost-ai test-call CLI
```

### 5. Codec Negotiation Logger (Both Sides)

```
Capabilities:
- Parse SDP offer/answer on both bot and client
- Log codec order, selected codec, and fmtp parameters
- Diff bot vs client negotiation for mismatches
- Exposed via data channel
```

### 6. A/V Sync Validator

```
Capabilities:
- Visual frame counter overlay on video frames (bot-side)
- Audio click track at 1-second intervals (bot-side)
- Bot-side delivery timestamps for both audio and video frames
- Data channel timestamp sync messages
- Client measures offset between visual counter and click track
```

### 7. Degradation Detector

```
Capabilities:
- 100ms resolution time-series logging for first 60 seconds
- Automatic state snapshots when metrics cross thresholds:
  - Audio: underruns > 0, RMS energy spike > 3x average
  - Video: frame interval > 2x target, buffer health < 20%
- Raw media ring buffer: last 5 seconds of PCM/I420
- On degradation trigger: flush ring buffer to disk for analysis
```

---

## Test Infrastructure

### ghost-ai test-call CLI

**Command:** `ghost-ai test-call`

```
Usage:
  ghost-ai test-call --type <voice|video> --duration <seconds> --output <report.json>

Options:
  --type          Call type: voice or video (default: video)
  --duration      Test duration in seconds (default: 30)
  --output        Output report file path (default: ./test-report.json)
  --reference     Reference signal: sine440 (default: sine440)
  --capture       Enable raw media capture (default: false)
  --headless      Run headless Chrome client (default: true)

Flow:
  1. Start bot with test configuration
  2. Launch headless Chrome client via Puppeteer
  3. Initiate call from client to bot
  4. Bot plays reference signal (audio) and/or test pattern (video)
  5. Client records received media via MediaRecorder
  6. After duration, hang up and analyze
  7. Generate composite quality report
```

### Test Runner: Headless Chrome Client

- Puppeteer-based headless Chrome instance
- Receives WebRTC call from the bot
- Records audio/video via MediaRecorder API
- Extracts frames for SSIM/PSNR comparison (video)
- Extracts PCM for PESQ scoring (audio)

### Pass/Fail Criteria

**Video — Composite Score:**
- FPS accuracy: measured FPS within 10% of target (weight: 30%)
- Drop rate: < 1% dropped frames (weight: 20%)
- SSIM: > 0.9 against source frames (weight: 25%)
- Frame timing: 95th percentile interval within 20% of target (weight: 25%)
- **Pass threshold:** composite score >= 80/100

**Audio — PESQ Score:**
- PESQ score > 3.5 against 440Hz reference signal
- **Pass threshold:** PESQ > 3.5 (ITU-T "good" quality)

---

## Developer Settings UI

### Location

New "Developer" section added to the Settings Dialog (`src/components/modals/SettingsDialog.tsx`).

### Settings Exposed

| Setting | Type | Default | Description |
|---|---|---|---|
| **Enable Call Diagnostics** | Toggle | OFF | Master switch for all diagnostic features |
| **Show Stats Overlay** | Toggle | OFF | Show real-time CallStatsOverlay during calls |
| **Frame Timing Alerts** | Toggle | ON* | Log alerts when frame intervals drift >5ms |
| **Ring Buffer Logging** | Toggle | ON* | Log audio ring buffer state per frame |
| **Raw Media Capture** | Toggle | OFF | Dump raw PCM/I420 to disk (high I/O) |
| **Codec Negotiation Log** | Toggle | ON* | Log SDP codec negotiation on both sides |
| **A/V Sync Validation** | Toggle | OFF | Enable frame counter + click track sync checks |
| **Degradation Detection** | Toggle | ON* | Auto-capture state on quality degradation |
| **Reference Signal Mode** | Toggle | OFF | Replace media with 440Hz test tone |

\* = Enabled when "Enable Call Diagnostics" is ON (lightweight, always-on tier)

### Persistence

Settings stored via `localStorage` (same pattern as `useCallSettings`):
- Key prefix: `dev_diag_`
- Example: `dev_diag_enabled`, `dev_diag_stats_overlay`, `dev_diag_raw_capture`

### UI Behavior

- Section appears at the bottom of the settings nav, with a code/wrench icon
- Warning banner: "These settings are for debugging. Raw media capture uses significant disk space."
- Master toggle gates the sub-settings visibility
- Settings take effect immediately (no restart required)
- Data channel communicates diagnostic config to the bot on call start

---

## Implementation Tracks

### Track 1: Fix Audio-Only Calls (Clear Root Cause)
1. Wire `remoteStream` to `AudioContext.destination` in `CallContext.tsx`
2. Ensure `AudioContext` is resumed (handle autoplay policy)
3. Test audio-only calls end-to-end
4. Verify with `getStats()` bytesReceived check

### Track 2: Build Diagnostic Tooling
1. Frame timing monitor with `process.hrtime.bigint()`
2. Ring buffer state logger
3. Raw media capture (.wav + .yuv)
4. 440Hz reference signal generator
5. Codec negotiation logger (both sides)
6. A/V sync validator
7. Degradation detector with threshold snapshots
8. Developer Settings UI tab in Settings Dialog
9. Data channel diagnostic config transport

### Track 3: Fix Video Speed
1. Implement native nanosleep timer addon
2. Replace `setInterval` in VideoSource with native timer
3. Add RTP timestamp interception in wrtc
4. Validate with frame timing monitor
5. Test with headless Chrome client

### Track 4: Fix Audio Garble
1. Deploy ring buffer state logging
2. Capture WAV dump during garble reproduction
3. Analyze ring buffer logs to find divergence point
4. Replace `setInterval` in AudioSource with native timer
5. Add ring buffer integrity guards
6. Validate with PESQ scoring against 440Hz reference

### Track 5: Test CLI
1. Build `ghost-ai test-call` CLI command
2. Implement headless Chrome test client (Puppeteer)
3. Implement composite video scoring
4. Integrate PESQ audio scoring
5. Generate JSON report with pass/fail

---

## Decision Log

| Question | Decision |
|---|---|
| Frame timing measurement | `process.hrtime.bigint()` nanosecond precision |
| Drift alert threshold | >5ms strict |
| RTP timestamp analysis | Intercept wrtc internals |
| Audio garble detection | Ring buffer state logging per frame |
| Reference signal type | 440Hz sine wave |
| Audio analysis tools | WAV dump + PESQ quality scoring |
| Audio-only call fix | Web Audio API only (no DOM element) |
| Audio verification | `getStats()` bytesReceived |
| WebRTC stats recording | Existing overlay is sufficient |
| Codec negotiation check | Log both sides and diff |
| Bot-side capture | Raw PCM/I420 tee (pre-wrtc) |
| Capture format | Raw .wav + .yuv (lossless) |
| A/V sync validation | All three methods combined |
| Timer replacement | Native addon / nanosleep |
| Network simulation | Not needed yet |
| Test runner | Headless Chrome client |
| Video pass/fail | Composite score (FPS + drops + SSIM + timing) |
| Audio pass/fail | PESQ > 3.5 |
| Diagnostic output | Data channel only |
| Test CLI | `ghost-ai test-call` standalone command |
| Degradation handling | Time-series + threshold snapshots + raw rewind |
| Diagnostic mode | Always-on with setting to toggle detail level |
| Video speed root cause | setInterval drift/bursts (confirmed hypothesis) |
| Bug priority | All in parallel |
