# Architecture Map — Umbra at a Glance

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────────┐  │
│  │  Expo   │  │  Tauri   │  │  Expo   │  │  React Native   │  │
│  │   Web   │  │ Desktop  │  │  iOS    │  │    Android      │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └───────┬─────────┘  │
│       └────────────┼─────────────┼────────────────┘            │
│              ┌─────▼─────────────▼──────┐                      │
│              │  @coexist/wisp-react-native │ ← ALL UI           │
│              │  (zero custom styling)      │                    │
│              └─────────────┬──────────────┘                    │
│              ┌─────────────▼──────────────┐                    │
│              │     Expo Router v6          │ ← file-based routes│
│              │     React Contexts          │ ← state management │
│              │     Custom Hooks (49)       │ ← shared logic     │
│              └─────────────┬──────────────┘                    │
│              ┌─────────────▼──────────────┐                    │
│              │    @umbra/service (TS)      │ ← API layer        │
│              └─────────────┬──────────────┘                    │
│                     ┌──────┴──────┐                            │
│                  ┌──▼───┐    ┌────▼───┐                        │
│                  │ WASM │    │  FFI   │                        │
│                  │(web) │    │(mobile)│                        │
│                  └──┬───┘    └────┬───┘                        │
│                     └──────┬─────┘                             │
│              ┌─────────────▼──────────────┐                    │
│              │    umbra-core (Rust)        │                    │
│              │  X25519 · AES-256-GCM      │                    │
│              │  Ed25519 · HKDF · DID:key  │                    │
│              └────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                         │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  umbra-relay   │  │ ghost-ai     │  │  Plugin Runtime     │  │
│  │  (Rust server) │  │ (Node.js bot)│  │  (TS sandbox)       │  │
│  │  P2P relay     │  │ WebRTC calls │  │  Slash commands     │  │
│  │  NAT traversal │  │ GPU server   │  │  API hooks          │  │
│  └───────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Message Send

```
User types message
  → MessageInput component
  → ChatContext.sendMessage()
  → @umbra/service.encrypt(plaintext, recipientPublicKey)
  → umbra-core (Rust): X25519 key exchange → AES-256-GCM encrypt
  → @umbra/service.send(encryptedPayload)
  → umbra-relay (if peer offline) OR direct P2P
  → Recipient: decrypt → display
```

## Data Flow: Voice/Video Call

```
User initiates call
  → CallContext.startCall()
  → CallManager.createPeerConnection()
  → WebRTC: ICE candidates via signaling
  → DTLS-SRTP encrypted media stream
  → Ghost AI bot (if AI call):
      FFmpeg decode (GPU/NVDEC) → stdout pipe
        → Ring Buffer (audio, 5s) / Frame Buffer (video, 60 frames)
        → Backpressure: pause FFmpeg when buffer >80%, resume <50%
        → drift-compensating setTimeout (NOT setInterval)
        → RTCAudioSource.onData() / RTCVideoSource.onFrame()
        → wrtc VP8/Opus encode → RTP → client
```

## Key Services (src/services/)

| Service | File Size | Responsibility |
|---------|-----------|----------------|
| `CallManager.ts` | 36KB | WebRTC peer connection management, ICE, SDP |
| `GroupCallManager.ts` | — | Multi-party call coordination |
| `SlashCommandRegistry.ts` | — | Plugin slash command routing |
| `SoundEngine.ts` | — | Audio playback, ringtones |
| `VoiceStreamBridge.ts` | — | Voice stream processing |

## Key Contexts (src/contexts/)

19 React Context providers. The critical ones:

| Context | What It Manages |
|---------|----------------|
| `CallContext` | Active call state, WebRTC lifecycle, stats overlay |
| `ChatContext` | Message send/receive, conversation state |
| `PluginContext` | Plugin lifecycle, slash command dispatch |
| `CommunityContext` | Community/channel/role management |
| `DeveloperSettingsContext` | Debug toggles, stats overlay, log levels |

## Package Dependency Graph

```
App (Expo)
  ├── @umbra/service ← API layer
  │     └── @umbra/wasm (web) / FFI (mobile) ← platform bridge
  │           └── umbra-core (Rust) ← cryptography
  ├── @umbra/plugin-runtime ← sandbox
  │     └── @umbra/plugin-sdk ← types & hooks
  ├── @coexist/wisp-react-native ← UI
  │     └── @coexist/wisp-core ← theme, tokens
  └── expo-umbra-core (native module)
      expo-video-effects (native module)
```

## Server Infrastructure

| Server | Address | Purpose |
|--------|---------|---------|
| Ghost AI GPU | 45.77.149.94 | AI bot (6 CPU, 62GB RAM, NVIDIA A16-16Q) |
| Relay | TBD | P2P relay for NAT traversal |

## Config & Environment

Ghost AI bot config lives in `packages/umbra-ghost-ai/src/config.ts`:

| Env Var | Default | Purpose |
|---------|---------|---------|
| `MAX_VIDEO_WIDTH` | 1280 | WebRTC video width cap |
| `MAX_VIDEO_HEIGHT` | 720 | WebRTC video height cap |
| `MAX_VIDEO_FPS` | 24 | WebRTC video FPS cap |
| `GHOST_DIAG_FRAME_TIMING` | true | Frame timing alerts |
| `GHOST_DIAG_DEGRADATION` | true | Degradation detection |
| `GHOST_DIAG_RAW_CAPTURE` | false | Raw media capture (heavy I/O) |
