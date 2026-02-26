# Umbra Audio Recorder Plugin — "Spectra"

> Multi-track voice call recording plugin for Umbra

## Name

**Spectra** — derived from "spectrum" (audio frequency spectrum / waveform visualization) with
a nod to Umbra's shadow-and-light theme. "Spectra" evokes both the visual frequency analysis
the plugin displays and the spectral/ghost aesthetic that fits the Umbra brand.

**Other candidates considered:**
- **Phantom Tracks** — ghost theme, multi-track metaphor
- **Penumbra** — partial shadow, sub-brand of Umbra
- **Nocturne** — night music piece
- **Eclipse** — shadow-related

---

## Overview

Spectra is an Umbra plugin that records individual audio tracks from voice calls and voice
channels. Each participant's audio stream is captured independently, enabling multi-track
export for podcasting, music collaboration, meeting archival, and content creation.

### Key Features

1. **Per-participant recording** — each person's audio captured as a separate track
2. **Real-time waveform visualization** — live audio meters per track during recording
3. **Multiple export formats** — separate stems or combined multi-track files
4. **Works in both call types** — 1:1 calls and community voice channels
5. **Recording controls** — integrated into call UI via plugin slots
6. **Session management** — pause/resume, naming, metadata, history

---

## Platform Support

| Platform | Recording | Export | Notes |
|----------|-----------|--------|-------|
| **Web** (browser) | MediaRecorder API | WebM/Opus, WAV, MP3 | Full support |
| **Tauri** (desktop) | MediaRecorder API + Tauri FS | All formats + disk save | Best experience |
| **Mobile** (RN) | Not supported (v1) | — | Future: react-native-audio-api |

The Tauri webview has full Web Audio API and MediaRecorder support, so the core recording
engine is identical for web and desktop. Tauri adds native filesystem access for saving
recordings to disk.

---

## Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Voice Call / Channel                        │
│                                                                 │
│  Local mic stream ──┐                                           │
│  Peer A stream ─────┤                                           │
│  Peer B stream ─────┤   ┌──────────────────────────────────┐   │
│  Peer C stream ─────┼──►│       Spectra Recording Engine    │   │
│                     │   │                                    │   │
│                     │   │  Per-track MediaRecorder instances │   │
│                     │   │  Per-track AnalyserNode (levels)  │   │
│                     │   │  Combined-mix ScriptProcessor     │   │
│                     │   │  WAV/WebM chunk accumulation      │   │
│                     │   └──────────┬───────────────────────┘   │
│                     │              │                             │
│                     │              ▼                             │
│                     │   ┌──────────────────────────────────┐   │
│                     │   │       Export / Encoding           │   │
│                     │   │                                    │   │
│                     │   │  WebM/Opus (native MediaRecorder) │   │
│                     │   │  WAV (PCM buffer → WAV header)    │   │
│                     │   │  MP3 (lamejs encoder)             │   │
│                     │   │  FLAC (libflacjs encoder)         │   │
│                     │   │  OGG/Opus (already in WebM)       │   │
│                     │   │  Multi-track ZIP bundle           │   │
│                     │   └──────────┬───────────────────────┘   │
│                     │              │                             │
│                     │              ▼                             │
│                     │   ┌──────────────────────────────────┐   │
│                     │   │       Storage / Download          │   │
│                     │   │                                    │   │
│                     │   │  Browser: Blob → download link    │   │
│                     │   │  Tauri: writeBinaryFile → disk    │   │
│                     │   │  Plugin KV: session metadata      │   │
│                     │   └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

```
plugins/spectra/
├── manifest.json                    # Plugin manifest
├── build.mjs                        # esbuild config
├── package.json                     # Dependencies
├── src/
│   ├── index.ts                     # Plugin activate/deactivate + component exports
│   │
│   ├── engine/
│   │   ├── RecordingEngine.ts       # Core multi-track recording orchestrator
│   │   ├── TrackRecorder.ts         # Per-stream MediaRecorder + AnalyserNode wrapper
│   │   ├── AudioMixer.ts            # Web Audio API mixer for combined output
│   │   └── WaveformSampler.ts       # Downsamples AnalyserNode data for visualization
│   │
│   ├── encoding/
│   │   ├── WavEncoder.ts            # PCM Float32 → WAV file (pure JS)
│   │   ├── Mp3Encoder.ts            # PCM → MP3 via lamejs (Web Worker)
│   │   ├── FlacEncoder.ts           # PCM → FLAC via libflac.js (optional)
│   │   └── formats.ts              # Format registry, MIME types, codec support detection
│   │
│   ├── export/
│   │   ├── ExportManager.ts         # Orchestrates encoding + file creation
│   │   ├── ZipBundler.ts            # Creates ZIP with multiple track files + metadata
│   │   ├── FileSaver.ts             # Browser download / Tauri disk write abstraction
│   │   └── MetadataWriter.ts        # ID3 tags / Vorbis comments with participant names
│   │
│   ├── state/
│   │   ├── RecordingContext.tsx      # React context for recording state
│   │   ├── useRecording.ts          # Hook: start/stop/pause/resume + status
│   │   ├── useTrackLevels.ts        # Hook: real-time per-track audio levels (60fps)
│   │   └── useRecordingHistory.ts   # Hook: past recordings from KV store
│   │
│   ├── components/
│   │   ├── RecordButton.tsx          # voice-call-controls slot: red record dot
│   │   ├── RecordingIndicator.tsx    # voice-call-header slot: "Recording 02:34"
│   │   ├── RecordingPanel.tsx        # right-panel slot: full multi-track view
│   │   ├── TrackMeter.tsx            # Per-participant audio meter (AudioWaveform)
│   │   ├── TrackList.tsx             # Scrollable list of track meters
│   │   ├── ExportDialog.tsx          # Format selection + export progress modal
│   │   ├── RecordingHistory.tsx      # settings-tab slot: past recordings browser
│   │   └── QuickRecordModal.tsx      # Modal for text channel "quick record" trigger
│   │
│   └── utils/
│       ├── time.ts                   # Duration formatting
│       ├── platform.ts              # isTauri(), supportsMediaRecorder(), etc.
│       └── constants.ts             # Defaults, thresholds, sample rates
│
└── dist/
    └── bundle.js                    # Built output (esbuild)
```

---

## Plugin Manifest

```json
{
  "id": "com.umbra.spectra",
  "name": "Spectra",
  "version": "1.0.0",
  "description": "Multi-track voice call recording with per-participant waveforms and flexible export formats.",
  "author": {
    "name": "Umbra Team",
    "url": "https://umbra.chat"
  },
  "icon": "spectra-icon.svg",
  "platforms": ["web", "desktop"],
  "permissions": [
    "storage:kv",
    "notifications",
    "commands"
  ],
  "slots": [
    {
      "slot": "voice-call-controls",
      "component": "RecordButton",
      "priority": 50
    },
    {
      "slot": "voice-call-header",
      "component": "RecordingIndicator",
      "priority": 50
    },
    {
      "slot": "right-panel",
      "component": "RecordingPanel",
      "priority": 50
    },
    {
      "slot": "settings-tab",
      "component": "RecordingHistory",
      "priority": 200
    },
    {
      "slot": "command-palette",
      "component": "RecordCommandEntry",
      "priority": 50
    }
  ],
  "storage": {
    "kv": true
  },
  "minAppVersion": "1.7.0"
}
```

---

## Platform Changes Required

### 1. New Plugin Slots (Plugin SDK)

The current plugin SDK defines 8 slots, none for voice/call UI. We need to add two:

**In `packages/umbra-plugin-sdk/src/types.ts`:**
```typescript
export type SlotName =
  | 'settings-tab'
  | 'sidebar-section'
  | 'message-actions'
  | 'chat-toolbar'
  | 'chat-header'
  | 'message-decorator'
  | 'right-panel'
  | 'command-palette'
  // NEW:
  | 'voice-call-controls'    // Buttons in the call control bar
  | 'voice-call-header';     // Indicators in the call header area
```

### 2. New Plugin Permission

**In `packages/umbra-plugin-sdk/src/types.ts`:**
```typescript
export type PluginPermission =
  | /* existing... */
  | 'voice:read';  // Access voice channel participant list and audio streams
```

### 3. Plugin API Extension

**New methods on PluginAPI for voice access:**
```typescript
interface PluginAPI {
  // ... existing ...

  // ── Voice (requires voice:read) ────────────────────────────────────────
  /** Whether the user is currently in a voice call/channel */
  isInVoiceCall(): boolean;
  /** Get all participant DIDs in the current voice call */
  getVoiceParticipants(): string[];
  /** Get the MediaStream for a specific participant (null if unavailable) */
  getVoiceStream(did: string): MediaStream | null;
  /** Get the local user's MediaStream */
  getLocalVoiceStream(): MediaStream | null;
  /** Subscribe to voice participant join/leave events */
  onVoiceParticipant(cb: (event: VoiceParticipantEvent) => void): () => void;
}
```

### 4. SlotRenderer in Voice UI

**In `components/community/VoiceCallPanel.tsx`** and **`VoiceChannelBar.tsx`:**

Add `<SlotRenderer>` calls where call controls and headers are rendered, passing
voice state as slot props:

```typescript
// VoiceChannelBar.tsx — Add after the Leave button
<SlotRenderer
  slot="voice-call-controls"
  props={{
    participants: channelParticipantDids,
    isMuted,
    isRecording: false, // will be set by plugin
  }}
/>
```

```typescript
// VoiceCallPanel.tsx — Pass to GroupCallPanel header area
<SlotRenderer
  slot="voice-call-header"
  props={{
    channelName,
    participants: channelParticipantDids,
  }}
/>
```

### 5. Voice Service Bridge

**In `packages/umbra-plugin-runtime/src/sandbox.ts`:**

Extend the ServiceBridge to expose voice stream access (gated by `voice:read` permission):

```typescript
interface ServiceBridge {
  // ... existing ...
  isInVoiceCall(): boolean;
  getVoiceParticipants(): string[];
  getVoiceStream(did: string): MediaStream | null;
  getLocalVoiceStream(): MediaStream | null;
  onVoiceParticipant(cb: (event: any) => void): () => void;
}
```

The bridge implementation in `PluginContext.tsx` will reference the `VoiceChannelContext`
and `GroupCallManager` to provide these.

---

## Recording Engine Design

### TrackRecorder

Each participant gets a `TrackRecorder` instance that wraps:

1. **MediaRecorder** — captures the stream as WebM/Opus chunks
2. **AnalyserNode** — provides real-time frequency/waveform data for visualization
3. **ScriptProcessorNode** (or AudioWorklet) — captures raw PCM for WAV/MP3 export

```typescript
class TrackRecorder {
  readonly did: string;
  readonly displayName: string;
  private stream: MediaStream;
  private mediaRecorder: MediaRecorder | null = null;
  private analyser: AnalyserNode;
  private pcmChunks: Float32Array[] = [];
  private webmChunks: Blob[] = [];
  private audioContext: AudioContext;
  private scriptProcessor: ScriptProcessorNode;

  // State
  status: 'idle' | 'recording' | 'paused' = 'idle';
  duration: number = 0;
  peakLevel: number = 0;

  start(): void;
  pause(): void;
  resume(): void;
  stop(): { webmBlob: Blob; pcmData: Float32Array; duration: number };

  // Real-time data (polled at 60fps by useTrackLevels)
  getWaveformData(): number[];     // 64 samples, 0-1 range
  getLevel(): number;               // 0-1 RMS level
  getPeakLevel(): number;           // 0-1 peak since last read
}
```

### RecordingEngine

Orchestrates all track recorders and the combined mix:

```typescript
class RecordingEngine {
  private tracks: Map<string, TrackRecorder> = new Map();
  private mixer: AudioMixer | null = null;
  private startTime: number = 0;

  status: 'idle' | 'recording' | 'paused' = 'idle';
  duration: number = 0;

  // Lifecycle
  startRecording(streams: Map<string, { stream: MediaStream; name: string }>): void;
  pauseRecording(): void;
  resumeRecording(): void;
  stopRecording(): RecordingSession;

  // Dynamic participant handling
  addTrack(did: string, stream: MediaStream, name: string): void;
  removeTrack(did: string): void;

  // Real-time access
  getTrackLevels(): Map<string, { level: number; waveform: number[] }>;
  getTracks(): TrackInfo[];
}
```

### AudioMixer

Creates a combined stereo mix of all tracks (for combined export):

```typescript
class AudioMixer {
  private context: AudioContext;
  private destination: MediaStreamAudioDestinationNode;
  private gains: Map<string, GainNode> = new Map();

  addSource(did: string, stream: MediaStream): void;
  removeSource(did: string): void;
  setTrackVolume(did: string, volume: number): void;  // 0-1
  setTrackPan(did: string, pan: number): void;         // -1 to 1
  getMixedStream(): MediaStream;  // For combined recording
}
```

---

## Export Formats

### Individual Track Formats

| Format | Codec | Extension | Method | Quality | Size |
|--------|-------|-----------|--------|---------|------|
| **WebM/Opus** | Opus | `.webm` | Native MediaRecorder | Excellent | Small |
| **WAV** | PCM 16-bit | `.wav` | JS encoder (PCM → WAV header) | Lossless | Large |
| **WAV 32-bit float** | PCM 32f | `.wav` | JS encoder | Lossless/Studio | Very large |
| **MP3** | LAME MP3 | `.mp3` | lamejs (Web Worker) | Good (VBR V0-V2) | Small |
| **FLAC** | FLAC | `.flac` | libflac.js (optional) | Lossless | Medium |
| **OGG/Opus** | Opus | `.ogg` | Remux from WebM | Excellent | Small |

### Combined Export Formats

| Format | Description | Method |
|--------|-------------|--------|
| **Stems ZIP** | ZIP containing one file per track + metadata.json | JSZip |
| **Combined WAV** | Single stereo WAV with all tracks mixed | AudioMixer → WAV encoder |
| **Combined MP3** | Single stereo MP3 with all tracks mixed | AudioMixer → lamejs |

### Multi-Track Containers (Stretch Goal)

| Format | Description | Notes |
|--------|-------------|-------|
| **MKA** (Matroska Audio) | Multiple Opus streams in one file | Needs mkvmerge or JS muxer |
| **Multi-channel WAV** | N-channel WAV (one channel per participant) | Works for ≤8 tracks |

### MP3 Multi-Track Note

True multi-track MP3 doesn't exist — MP3 is inherently single-stream (mono or stereo).
The best approach for MP3-based multi-track is the **Stems ZIP** format: a ZIP containing
one MP3 per participant plus a `metadata.json` describing the session.

---

## UI Components

### RecordButton (voice-call-controls slot)

Compact button that fits alongside mute/deafen/leave controls:

```
┌──────────────────────────────────────┐
│ ● Voice Connected                    │
│   #general  [🎤] [🔇] [⏺] [📞]   │
│                         ^^^          │
│                    Record button      │
└──────────────────────────────────────┘
```

States:
- **Idle**: Gray circle outline, "Record" tooltip
- **Recording**: Pulsing red dot, "Stop Recording" tooltip
- **Paused**: Orange dot, "Resume Recording" tooltip

### RecordingIndicator (voice-call-header slot)

Shown in the voice call panel header when recording is active:

```
┌──────────────────────────────────────────────────┐
│  #general                    ⏺ Recording 02:34   │
│                              ^^^^^^^^^^^^^^^^^^   │
│                              Pulsing red dot +    │
│                              elapsed timer        │
└──────────────────────────────────────────────────┘
```

### RecordingPanel (right-panel slot)

Full recording dashboard opened from the record button or command palette:

```
┌──────────────────────────────────────┐
│  Spectra — Recording                 │
│  ● REC  02:34                        │
│  ┌────────────────────────────────┐  │
│  │  ■ You           ▕▎▍▌██▎▍▎▕   │  │
│  │    PCM 48kHz      ▏▎▍▌█▍▎▏    │  │
│  ├────────────────────────────────┤  │
│  │  ■ Alice         ▕▎▍██▌▍▎▕    │  │
│  │    PCM 48kHz      ▏▎▍█▎▏      │  │
│  ├────────────────────────────────┤  │
│  │  ■ Bob           ▕▎▍▌█▍▎▕     │  │
│  │    PCM 48kHz      ▏▎▍▌▎▏      │  │
│  └────────────────────────────────┘  │
│                                      │
│  Format: [WAV ▾]  Quality: [48kHz ▾] │
│                                      │
│  [⏸ Pause]  [⏹ Stop & Export]       │
└──────────────────────────────────────┘
```

Each track meter uses the Wisp `AudioWaveform` component with real-time data from
the `TrackRecorder.getWaveformData()` method, showing a rolling waveform visualization.

Color coding:
- Track with audio: accent color waveform
- Silent track: muted/gray waveform
- Clipping: danger/red waveform

### ExportDialog

Modal shown after stopping a recording:

```
┌──────────────────────────────────────────┐
│  Export Recording                    [X] │
│                                          │
│  Session: "Community Hangout"            │
│  Duration: 14:23                         │
│  Tracks: 4                               │
│                                          │
│  Export Format:                           │
│  ┌────────────────────────────────────┐  │
│  │ ○ Stems (ZIP)  — One file per     │  │
│  │   participant                      │  │
│  │ ○ Combined Mix — Single stereo    │  │
│  │   file with all tracks            │  │
│  │ ○ Multi-channel WAV — All tracks  │  │
│  │   as separate channels            │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Track Format:                           │
│  ┌────────────────────────────────────┐  │
│  │ ○ WAV (lossless, large)           │  │
│  │ ○ MP3 320kbps (lossy, small)      │  │
│  │ ○ FLAC (lossless, medium)         │  │
│  │ ○ WebM/Opus (lossy, smallest)     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Sample Rate: [48000 Hz ▾]              │
│  Bit Depth:   [16-bit ▾]               │
│                                          │
│  [Cancel]              [Export ▸]        │
└──────────────────────────────────────────┘
```

### RecordingHistory (settings-tab slot)

Browse and re-export past recording sessions:

```
┌──────────────────────────────────────────┐
│  Recording History                       │
│  ┌────────────────────────────────────┐  │
│  │  Community Hangout                 │  │
│  │  Feb 25, 2026 · 14:23 · 4 tracks  │  │
│  │  [Re-export]  [Delete]             │  │
│  ├────────────────────────────────────┤  │
│  │  1:1 with Alice                    │  │
│  │  Feb 24, 2026 · 3:45 · 2 tracks   │  │
│  │  [Re-export]  [Delete]             │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Storage used: 234 MB                    │
│  [Clear All Recordings]                  │
└──────────────────────────────────────────┘
```

---

## Recording State Machine

```
                    start()
     ┌──────┐  ──────────────►  ┌────────────┐
     │ IDLE │                   │ RECORDING  │
     └──────┘  ◄──────────────  └─────┬──────┘
                   stop()             │
                                pause()│  resume()
                                      ▼     ▲
                                ┌────────────┐
                                │  PAUSED    │
                                └────────────┘
                                      │
                                  stop()
                                      ▼
                                ┌────────────┐
                                │ EXPORTING  │ → ExportDialog
                                └────────────┘
                                      │
                                  done/cancel
                                      ▼
                                ┌────────────┐
                                │   IDLE     │
                                └────────────┘
```

---

## Dynamic Track Handling

When participants join/leave mid-recording:

**Join:**
1. `onVoiceParticipant` fires with `{ type: 'joined', did }` event
2. `RecordingEngine.addTrack()` creates a new `TrackRecorder`
3. Track starts recording from the join timestamp
4. Silent padding is written for the gap from session start → join time
5. UI updates to show new track in `RecordingPanel`

**Leave:**
1. `onVoiceParticipant` fires with `{ type: 'left', did }` event
2. `TrackRecorder` is stopped, PCM/WebM data is finalized
3. Track remains in the track list (grayed out) with final duration
4. On export, track is padded with silence to match session duration

---

## Dependencies

### Runtime (bundled into plugin)

| Package | Purpose | Size |
|---------|---------|------|
| `lamejs` | MP3 encoding in browser | ~170KB |
| `jszip` | ZIP bundle creation | ~95KB |

### Optional (loaded on demand)

| Package | Purpose | Size |
|---------|---------|------|
| `libflac.js` | FLAC encoding | ~350KB |

### Platform (already available)

| API | Purpose | Available |
|-----|---------|-----------|
| `MediaRecorder` | WebM/Opus capture | Web + Tauri |
| `AudioContext` | Audio routing + analysis | Web + Tauri |
| `AnalyserNode` | Waveform/level data | Web + Tauri |
| `AudioWorkletNode` | PCM capture (preferred) | Web + Tauri |
| `ScriptProcessorNode` | PCM capture (fallback) | Web + Tauri |
| Tauri `fs` plugin | Save files to disk | Tauri only |

---

## Implementation Phases

### Phase 1: Platform Foundation (slots + permissions)
**Files to modify:**
- `packages/umbra-plugin-sdk/src/types.ts` — Add `voice-call-controls`, `voice-call-header` slots + `voice:read` permission
- `packages/umbra-plugin-runtime/src/sandbox.ts` — Wire voice API methods + permission gate
- `contexts/PluginContext.tsx` — Implement voice service bridge methods
- `components/community/VoiceChannelBar.tsx` — Add SlotRenderer for voice-call-controls
- `components/community/VoiceCallPanel.tsx` — Add SlotRenderer for voice-call-header

### Phase 2: Recording Engine
**New files:**
- `plugins/spectra/src/engine/TrackRecorder.ts`
- `plugins/spectra/src/engine/RecordingEngine.ts`
- `plugins/spectra/src/engine/AudioMixer.ts`
- `plugins/spectra/src/engine/WaveformSampler.ts`

Core recording with MediaRecorder + PCM capture + real-time analysis.

### Phase 3: Encoding & Export
**New files:**
- `plugins/spectra/src/encoding/WavEncoder.ts`
- `plugins/spectra/src/encoding/Mp3Encoder.ts`
- `plugins/spectra/src/encoding/formats.ts`
- `plugins/spectra/src/export/ExportManager.ts`
- `plugins/spectra/src/export/ZipBundler.ts`
- `plugins/spectra/src/export/FileSaver.ts`

WAV + MP3 + WebM export, ZIP bundling, Tauri file save.

### Phase 4: UI Components
**New files:**
- `plugins/spectra/src/components/RecordButton.tsx`
- `plugins/spectra/src/components/RecordingIndicator.tsx`
- `plugins/spectra/src/components/RecordingPanel.tsx`
- `plugins/spectra/src/components/TrackMeter.tsx`
- `plugins/spectra/src/components/TrackList.tsx`
- `plugins/spectra/src/components/ExportDialog.tsx`
- `plugins/spectra/src/state/RecordingContext.tsx`
- `plugins/spectra/src/state/useRecording.ts`
- `plugins/spectra/src/state/useTrackLevels.ts`

### Phase 5: Session Persistence & History
**New files:**
- `plugins/spectra/src/state/useRecordingHistory.ts`
- `plugins/spectra/src/components/RecordingHistory.tsx`
- `plugins/spectra/src/export/MetadataWriter.ts`

KV-backed recording history, re-export, cleanup.

### Phase 6: Polish & Stretch Goals
- FLAC encoding support
- Multi-channel WAV export
- Track volume/pan adjustment pre-export
- Recording quality presets (podcast, music, voice memo)
- Keyboard shortcuts (Ctrl+Shift+R to toggle recording)
- Consent notification to all participants when recording starts

---

## Technical Considerations

### Audio Capture Strategy

**Problem**: MediaRecorder natively produces WebM/Opus chunks, but we also need raw PCM
for WAV/MP3/FLAC export.

**Solution**: Dual-capture pipeline per track:

1. **MediaRecorder** → accumulates WebM/Opus chunks (for quick WebM export)
2. **AudioWorkletNode** (or ScriptProcessorNode fallback) → captures Float32 PCM samples
   into a growing buffer (for WAV/MP3/FLAC export)

The AudioWorklet approach is preferred as ScriptProcessorNode is deprecated, but we
include it as a fallback for older browser engines.

### Memory Management

For long recordings, PCM data can grow large (48kHz × 4 bytes × 60 min = ~690MB per mono track).

**Mitigations:**
- **Chunked storage**: PCM stored in fixed-size chunks (e.g., 30-second Float32Arrays)
- **WebM-first**: For users who only need WebM/Opus, skip PCM capture entirely
- **Memory warning**: Show a warning when estimated memory usage exceeds a threshold
- **Tauri disk streaming**: On desktop, periodically flush PCM chunks to temp files via Tauri FS

### Thread Safety

Encoding (especially MP3) is CPU-intensive. Use **Web Workers** for encoding:

```
Main Thread                    Worker Thread
────────────                   ─────────────
stopRecording() ───────►  Receive PCM chunks
                          Encode to MP3/FLAC
                    ◄───  Return encoded Blob
```

### Consent & Privacy

Recording other people's audio has privacy implications:

1. **Visual indicator**: All participants see a "Recording" badge when someone records
2. **Toast notification**: "User started recording" shown to all channel members
3. **Optional consent mode**: Recording only starts after all participants acknowledge
4. **Metadata**: Recording metadata includes who initiated it and who was present

Note: Implementing participant notification requires extending the relay signaling to
broadcast recording state. For v1, we show the indicator locally and document that users
should verbally announce recording.

### Browser Codec Support

| Browser | MediaRecorder codecs | Notes |
|---------|---------------------|-------|
| Chrome/Edge | `audio/webm;codecs=opus` | Best support |
| Firefox | `audio/webm;codecs=opus`, `audio/ogg;codecs=opus` | Also supports OGG |
| Safari | `audio/mp4;codecs=aac` | No WebM; use MP4/AAC |
| Tauri (WebKitGTK) | `audio/webm;codecs=opus` | Same as Chrome |

The plugin detects supported codecs at startup and adjusts available formats accordingly.

---

## Metadata JSON Schema

Included in ZIP exports:

```json
{
  "version": 1,
  "plugin": "com.umbra.spectra",
  "session": {
    "id": "uuid-v4",
    "name": "Community Hangout",
    "startedAt": "2026-02-25T14:30:00Z",
    "endedAt": "2026-02-25T14:44:23Z",
    "duration": 863,
    "initiatedBy": "did:key:z6Mk..."
  },
  "tracks": [
    {
      "did": "did:key:z6Mk...",
      "displayName": "You",
      "filename": "you.wav",
      "format": "wav",
      "sampleRate": 48000,
      "channels": 1,
      "bitDepth": 16,
      "duration": 863,
      "joinedAt": 0,
      "leftAt": null
    },
    {
      "did": "did:key:z6Mk...",
      "displayName": "Alice",
      "filename": "alice.wav",
      "format": "wav",
      "sampleRate": 48000,
      "channels": 1,
      "bitDepth": 16,
      "duration": 720,
      "joinedAt": 45,
      "leftAt": 765
    }
  ],
  "settings": {
    "format": "wav",
    "sampleRate": 48000,
    "bitDepth": 16,
    "exportType": "stems"
  }
}
```

---

## Integration with Existing Systems

### GroupCallManager Access

The plugin needs access to per-participant MediaStreams. These are already tracked in
`GroupCallManager`:

- `getLocalStream()` → local mic stream
- `getPeerStream(did)` → individual peer stream
- `getAllPeerStreams()` → all peer streams
- `onRemoteStream` callback → notifies when new peer connects

The voice service bridge (Phase 1) wraps these for plugin access.

### 1:1 Call Integration

For 1:1 calls via `CallManager`:
- `localStream` → local mic
- Remote stream from `RTCPeerConnection.ontrack`

The service bridge abstracts both call types behind the same `getVoiceStream()` API.

### Wisp Components Used

| Component | Usage |
|-----------|-------|
| `AudioWaveform` | Per-track rolling waveform visualization |
| `Dialog` | Export format selection modal |
| `Button` | Record/Stop/Pause/Export actions |
| `Progress` | Export encoding progress bar |
| `Text` | Labels, timers, track names |
| `VStack` / `HStack` | Layout |
| `Card` | Track meter containers |
| `Badge` | "REC" indicator |
| `Meter` | Simple level meter alternative |
| `SegmentedControl` | Format/quality selection |
| `Select` | Sample rate, bit depth dropdowns |
| `useTheme` | Consistent styling with current theme |

---

## Open Questions

1. **Should PCM capture be opt-in?** — Default to WebM-only (low memory) with PCM enabled
   when the user selects WAV/MP3/FLAC export format in settings?

2. **Recording storage**: Store raw recordings in IndexedDB (web) or temp directory (Tauri)
   for re-export, or only keep the exported files?

3. **Max recording duration**: Should we enforce a limit (e.g., 4 hours) to prevent
   runaway memory usage?

4. **Participant consent**: V1 shows a local indicator. V2 could broadcast recording state
   via the relay. Worth adding relay signaling now?

5. **1:1 call support**: Should the record button appear in 1:1 call UI as well, or
   voice channels only?
