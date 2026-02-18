<p align="center">
  <img src="assets/images/icon.png" alt="Umbra" width="120" height="120">
</p>

<h1 align="center">Umbra</h1>

<p align="center">
  <strong>Private, peer-to-peer messaging with end-to-end encryption</strong>
</p>

<p align="center">
  <a href="https://umbra.chat">Web App</a> ·
  <a href="https://github.com/InfamousVague/Umbra/releases">Downloads</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#security">Security</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web%20%7C%20macOS%20%7C%20Windows%20%7C%20Linux-blue" alt="Platforms">
  <img src="https://img.shields.io/badge/encryption-E2E-green" alt="E2E Encryption">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

---

## Overview

Umbra is a cross-platform encrypted messaging application built on a zero-trust architecture. Messages are encrypted client-side before leaving your device, ensuring that neither relay servers nor anyone else can read your conversations.

### Key Features

- **End-to-End Encryption** — All messages encrypted with [X25519][x25519] + [AES-256-GCM][aes-gcm]
- **Self-Sovereign Identity** — Own your identity with a 24-word recovery phrase ([BIP-39][bip39])
- **Peer-to-Peer** — Direct [WebRTC][webrtc] connections when possible, relay-assisted when needed
- **Offline Messaging** — Messages queued and delivered when recipients come online
- **Voice & Video Calling** — Encrypted 1:1 calls with [TURN][turn] fallback for restrictive networks
- **Groups** — Encrypted group chats with shared keys
- **Communities** — Large-scale servers with spaces, channels, roles, and permissions
- **Cross-Platform** — Native apps for iOS, Android, macOS, Windows, Linux, and Web
- **Plugin System** — Extensible with custom plugins

---

## Quick Start

### Use the Web App

Visit **[umbra.chat](https://umbra.chat)** to get started instantly in your browser.

### Download Desktop/Mobile Apps

Download the latest release for your platform from the [Releases page](https://github.com/InfamousVague/Umbra/releases):

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `Umbra_*_aarch64.dmg` |
| macOS (Intel) | `Umbra_*_x64.dmg` |
| Windows | `Umbra_*.msi` |
| Linux (Debian/Ubuntu) | `Umbra_*.deb` |
| Linux (AppImage) | `Umbra_*.AppImage` |
| iOS | App Store (coming soon) |
| Android | Google Play (coming soon) |

### Run Your Own Relay

See [packages/umbra-relay/README.md](packages/umbra-relay/README.md) for instructions on running your own relay server.

---

## Architecture

Umbra consists of several packages that work together:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UMBRA ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         CLIENT APPLICATIONS                            │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │ │
│  │   │   iOS    │  │ Android  │  │   Web    │  │  macOS   │  │Windows │  │ │
│  │   │          │  │          │  │ Browser  │  │  Linux   │  │        │  │ │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │ │
│  │        │             │             │             │            │       │ │
│  │        └─────────────┴──────┬──────┴─────────────┴────────────┘       │ │
│  │                             │                                         │ │
│  │                    ┌────────▼────────┐                                │ │
│  │                    │  React Native   │    Expo + Expo Router          │ │
│  │                    │   + Tauri       │    (Mobile/Web/Desktop)        │ │
│  │                    └────────┬────────┘                                │ │
│  │                             │                                         │ │
│  └─────────────────────────────┼─────────────────────────────────────────┘ │
│                                │                                            │
│  ┌─────────────────────────────▼─────────────────────────────────────────┐ │
│  │                       SERVICE LAYER (TypeScript)                      │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │   @umbra/service          @umbra/wasm           @umbra/plugin-*      │ │
│  │   ├── Identity            ├── WASM Loader       ├── Plugin SDK       │ │
│  │   ├── Messaging           ├── Event Bridge      └── Plugin Runtime   │ │
│  │   ├── Groups              ├── SQL Bridge                             │ │
│  │   ├── Communities         └── Tauri Backend                          │ │
│  │   ├── Calling                                                        │ │
│  │   └── Friends                                                        │ │
│  │                                                                       │ │
│  └───────────────────────────────┬───────────────────────────────────────┘ │
│                                  │                                          │
│  ┌───────────────────────────────▼───────────────────────────────────────┐ │
│  │                        CORE LAYER (Rust + WASM)                       │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │   umbra-core                                                          │ │
│  │   ├── crypto/        Ed25519, X25519, AES-256-GCM, HKDF               │ │
│  │   ├── identity/      DID:key, BIP-39 recovery phrases                │ │
│  │   ├── storage/       SQLite (native) / sql.js (WASM)                 │ │
│  │   ├── network/       libp2p, WebRTC transport                        │ │
│  │   └── messaging/     Encrypted conversations                         │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         RELAY SERVERS (Rust)                          │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │   umbra-relay                                                         │ │
│  │   ├── WebSocket signaling      (WebRTC SDP/ICE exchange)             │ │
│  │   ├── Offline message queue    (7-day TTL, encrypted blobs)          │ │
│  │   ├── Session relay            (QR-based friend adding)              │ │
│  │   └── Federation               (Multi-relay mesh)                    │ │
│  │                                                                       │ │
│  │   Deployed:                                                           │ │
│  │   • wss://relay.umbra.chat        (US East)                          │ │
│  │   • wss://seoul.relay.umbra.chat  (Asia Pacific)                     │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Packages

### [`umbra-core`](packages/umbra-core/) — Rust Core Library

The cryptographic and networking backbone, compiled to [WebAssembly][wasm] for browsers and native code for mobile/desktop.

| Module | Purpose |
|--------|---------|
| `crypto/` | [Ed25519][ed25519] signatures, [X25519][x25519] key exchange, [AES-256-GCM][aes-gcm] encryption, [HKDF][hkdf] key derivation |
| `identity/` | [DID:key][did-key] generation, [BIP-39][bip39] recovery phrases, profile management |
| `storage/` | Encrypted [SQLite][sqlite] database (native: [rusqlite][rusqlite], WASM: [sql.js][sqljs]) |
| `network/` | [libp2p][libp2p] networking, [WebRTC][webrtc] transport, relay client |
| `messaging/` | Conversation encryption, message handling |

**Build targets:**
- `cdylib` — Dynamic library for FFI (iOS/Android via UniFFI)
- `staticlib` — Static library for iOS
- `wasm32` — WebAssembly for browsers

### [`umbra-service`](packages/umbra-service/) — TypeScript API Layer

Cross-platform TypeScript API that wraps umbra-core, providing a unified interface for all platforms.

```typescript
import { UmbraService } from '@umbra/service';

const umbra = new UmbraService();

// Create identity
const identity = await umbra.createIdentity('Alice');
console.log('Your DID:', identity.did);
console.log('Recovery phrase:', identity.recoveryPhrase);

// Send encrypted message
await umbra.sendMessage(friendDid, 'Hello!');

// Listen for messages
umbra.onMessage((msg) => {
  console.log(`${msg.senderDid}: ${msg.content}`);
});
```

### [`umbra-wasm`](packages/umbra-wasm/) — WASM Bridge

Browser integration layer handling:
- Runtime backend detection ([Tauri][tauri] vs WASM)
- Event dispatching from Rust to JavaScript
- [sql.js][sqljs] SQLite integration
- [IndexedDB][indexeddb] persistence

### [`umbra-relay`](packages/umbra-relay/) — Relay Server

Lightweight WebSocket relay server for signaling and offline message delivery.

```bash
# Run with Docker
docker run -d -p 8080:8080 ghcr.io/infamousvague/umbra-relay

# Or build from source
cd packages/umbra-relay
cargo build --release
./target/release/umbra-relay --port 8080
```

See [packages/umbra-relay/README.md](packages/umbra-relay/README.md) for full documentation.

### [`umbra-plugin-sdk`](packages/umbra-plugin-sdk/) & [`umbra-plugin-runtime`](packages/umbra-plugin-runtime/) — Plugin System

Extensible plugin architecture for custom functionality. Plugins run in a sandboxed environment with controlled access to Umbra APIs.

---

## Security

### Cryptographic Specifications

Umbra uses industry-standard, audited cryptographic primitives:

| Algorithm | Purpose | Specification |
|-----------|---------|---------------|
| [**Ed25519**][ed25519] | Digital signatures | [RFC 8032][rfc8032] — Edwards-Curve Digital Signature Algorithm |
| [**X25519**][x25519] | Key exchange | [RFC 7748][rfc7748] — Elliptic Curves for Security |
| [**AES-256-GCM**][aes-gcm] | Authenticated encryption | [NIST SP 800-38D][nist-gcm] — Galois/Counter Mode |
| [**HKDF-SHA256**][hkdf] | Key derivation | [RFC 5869][rfc5869] — HMAC-based Key Derivation Function |
| [**PBKDF2-SHA512**][pbkdf2] | Seed derivation | [RFC 8018][rfc8018] — Password-Based Key Derivation |
| [**BIP-39**][bip39] | Mnemonic phrases | [BIP-39 Specification][bip39-spec] — Mnemonic code for generating deterministic keys |
| [**DID:key**][did-key] | Decentralized identifiers | [W3C DID:key Method][did-key-spec] — Self-certifying identifiers |

### Key Hierarchy

```
Recovery Phrase (BIP-39¹ — 24 words, 256 bits entropy)
        │
        ▼
┌───────────────────────────────────────────────┐
│         Master Seed (256 bits)                │
│     Derived via PBKDF2-SHA512² (2048 rounds)  │
└───────────────────────────────────────────────┘
        │
        │ HKDF-SHA256³ with domain separation
        │
        ├────────────────┬────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Signing Key  │ │ Encryption   │ │ Storage Key  │
│  (Ed25519⁴)  │ │ Key (X25519⁵)│ │  (AES-256⁶)  │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ • Identity   │ │ • Key Exch.  │ │ • Database   │
│ • Signatures │ │ • E2E Crypto │ │   Encryption │
│ • DID:key⁷   │ │ • Shared     │ │              │
│              │ │   Secrets    │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Message Encryption Flow

```
Alice                                              Bob
  │                                                  │
  │  1. Compute shared secret via X25519⁵ ECDH:      │
  │     Alice_private × Bob_public = shared          │
  │                                                  │
  │  2. Derive encryption key via HKDF-SHA256³:      │
  │     key = HKDF(shared, conversation_id,          │
  │                "umbra-message-encryption-v1")    │
  │                                                  │
  │  3. Encrypt with AES-256-GCM⁶:                   │
  │     • 256-bit key                                │
  │     • 96-bit random nonce (per message)          │
  │     • 128-bit authentication tag                 │
  │     • AAD = sender ‖ recipient ‖ timestamp       │
  │                                                  │
  │  4. Sign with Ed25519⁴:                          │
  │     signature = Sign(ciphertext ‖ metadata)      │
  │                                                  │
  │  ──────────── encrypted + signed ───────────────▶│
  │                                                  │
  │                       Verify signature, derive   │
  │                       same key, decrypt message  │
```

### Security Properties

| Property | Implementation |
|----------|----------------|
| **Confidentiality** | [AES-256-GCM][aes-gcm] encryption with per-conversation derived keys |
| **Integrity** | [GCM][nist-gcm] 128-bit authentication tag detects tampering |
| **Authenticity** | [Ed25519][ed25519] signatures on all messages |
| **Forward Secrecy** | Per-conversation key derivation via [HKDF][hkdf] with unique salts |
| **Non-repudiation** | Sender signature cryptographically bound to message content |
| **Key Zeroization** | All secrets implement [`ZeroizeOnDrop`][zeroize] for secure memory cleanup |

### Threat Model

**Trusted:**
- Your own device (key storage)
- Friends' devices (they can read messages you send them)

**Untrusted:**
- Relay servers (see encrypted blobs only, no plaintext access)
- Network infrastructure (all traffic encrypted via [TLS][tls] + E2E)
- Third parties (E2E encryption prevents eavesdropping)

### Cryptographic Libraries

All cryptography is implemented using audited, pure-Rust libraries from the [dalek-cryptography][dalek] project:

| Library | Purpose |
|---------|---------|
| [`ed25519-dalek`][ed25519-dalek] | [Ed25519][ed25519] signatures |
| [`x25519-dalek`][x25519-dalek] | [X25519][x25519] key exchange |
| [`aes-gcm`][aes-gcm-crate] | [AES-256-GCM][aes-gcm] authenticated encryption |
| [`hkdf`][hkdf-crate] | [HKDF][hkdf] key derivation |
| [`sha2`][sha2-crate] | [SHA-256/SHA-512][sha2] hashing |
| [`zeroize`][zeroize] | Secure memory zeroing |

---

## Deployment

### Deploying the Web App

```bash
# Build
npm ci
npx expo export --platform web

# Deploy to your server
rsync -avz dist/ user@server:/var/www/umbra/
```

### Deploying Relay Servers

See [packages/umbra-relay/README.md](packages/umbra-relay/README.md) for detailed instructions including:
- Docker deployment
- Building from source
- Nginx/SSL configuration with [Let's Encrypt][letsencrypt]
- Systemd service setup

### Production Relay Configuration

```bash
# Example: Run relay with federation
./umbra-relay \
  --port 8080 \
  --region "US East" \
  --location "New York" \
  --peers "wss://seoul.relay.umbra.chat/ws"
```

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_PORT` | `8080` | Server port |
| `RELAY_REGION` | `US East` | Region label |
| `RELAY_LOCATION` | `New York` | Location label |
| `MAX_OFFLINE_MESSAGES` | `1000` | Queue limit per user |
| `OFFLINE_TTL_DAYS` | `7` | Message retention |
| `RELAY_PEERS` | — | Federation peer URLs |

---

## Development

### Prerequisites

- **Node.js** 20+
- **Rust** 1.75+ (for building umbra-core)
- **[wasm-pack][wasm-pack]** (for WASM builds)

### Setup

```bash
# Clone the repository
git clone https://github.com/InfamousVague/Umbra.git
cd Umbra

# Install dependencies
npm install

# Start development server
npm run web
```

### Building

```bash
# Build WASM core
npm run build:wasm

# Build web app
npm run build:web

# Build desktop apps (requires Tauri CLI)
npm run build:desktop       # All platforms
npm run build:mac           # macOS only
npm run build:win           # Windows only
npm run build:linux         # Linux only

# Build relay server
cd packages/umbra-relay
cargo build --release
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (requires Playwright)
npm run test:e2e

# Test relay server
cd packages/umbra-relay
cargo test
```

### Project Structure

```
Umbra/
├── app/                    # Expo Router pages
│   ├── (auth)/             # Authentication screens
│   └── (main)/             # Main app screens
├── components/             # React components
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── packages/
│   ├── umbra-core/         # Rust core (crypto, networking)
│   ├── umbra-service/      # TypeScript API layer
│   ├── umbra-wasm/         # WASM bridge
│   ├── umbra-relay/        # Relay server
│   ├── umbra-plugin-sdk/   # Plugin development kit
│   └── umbra-plugin-runtime/ # Plugin execution
├── src-tauri/              # Tauri desktop shell
├── scripts/                # Build & deploy scripts
└── infra/                  # Infrastructure configs
    └── coturn/             # TURN server config
```

---

## API Reference

### Identity

```typescript
// Create new identity (generates BIP-39 recovery phrase)
const { did, recoveryPhrase } = await umbra.createIdentity('Display Name');

// Restore from recovery phrase
await umbra.restoreIdentity(recoveryPhrase);

// Get current identity
const identity = await umbra.getIdentity();
```

### Friends

```typescript
// Send friend request
await umbra.sendFriendRequest(theirDid);

// Accept friend request
await umbra.acceptFriendRequest(requestId);

// Get friends list
const friends = await umbra.getFriends();
```

### Messaging

```typescript
// Send encrypted message (uses X25519 + AES-256-GCM)
await umbra.sendMessage(friendDid, 'Hello!');

// Listen for messages
umbra.onMessage((message) => {
  console.log(message.content);
});

// Get conversation history
const messages = await umbra.getMessages(conversationId);
```

### Groups

```typescript
// Create group (generates shared group key)
const group = await umbra.createGroup('Group Name', [member1Did, member2Did]);

// Send group message
await umbra.sendGroupMessage(groupId, 'Hello everyone!');

// Invite member
await umbra.inviteToGroup(groupId, newMemberDid);
```

---

## Relay Protocol

The relay uses a simple JSON-over-WebSocket protocol. All message payloads are E2E encrypted — the relay only sees opaque ciphertext.

### Client → Server

```typescript
// Register with DID (DID:key format)
{ "type": "Register", "did": "did:key:z6Mk..." }

// Send encrypted message
{ "type": "Send", "to": "did:key:...", "payload": "<AES-256-GCM ciphertext>" }

// Create friend session (for QR code pairing)
{ "type": "CreateSession" }

// Join friend session
{ "type": "JoinSession", "sessionId": "abc123" }
```

### Server → Client

```typescript
// Delivery confirmation
{ "type": "Delivered", "messageId": "..." }

// Incoming message
{ "type": "Message", "from": "did:key:...", "payload": "<encrypted>" }

// Session events
{ "type": "SessionCreated", "sessionId": "..." }
{ "type": "PeerJoined", "did": "did:key:...", "publicKey": "..." }
```

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Umbra is built on the shoulders of giants:

- **[libp2p][libp2p]** — Modular P2P networking stack
- **[dalek-cryptography][dalek]** — Rust implementations of Curve25519 primitives
- **[Expo][expo]** — React Native toolchain
- **[Tauri][tauri]** — Rust-based desktop app framework
- **[sql.js][sqljs]** — SQLite compiled to WebAssembly

---

## Footnotes

<sup>1</sup> [BIP-39][bip39-spec]: Mnemonic code for generating deterministic keys
<sup>2</sup> [PBKDF2][rfc8018]: Password-Based Key Derivation Function 2 (RFC 8018)
<sup>3</sup> [HKDF][rfc5869]: HMAC-based Key Derivation Function (RFC 5869)
<sup>4</sup> [Ed25519][rfc8032]: Edwards-Curve Digital Signature Algorithm (RFC 8032)
<sup>5</sup> [X25519][rfc7748]: Elliptic Curve Diffie-Hellman using Curve25519 (RFC 7748)
<sup>6</sup> [AES-256-GCM][nist-gcm]: Advanced Encryption Standard with Galois/Counter Mode (NIST SP 800-38D)
<sup>7</sup> [DID:key][did-key-spec]: W3C Decentralized Identifier method for self-certifying keys

---

<p align="center">
  <sub>Built with privacy in mind.</sub>
</p>

<!-- Reference Links -->

<!-- Cryptographic Standards -->
[ed25519]: https://en.wikipedia.org/wiki/EdDSA#Ed25519
[x25519]: https://en.wikipedia.org/wiki/Curve25519
[aes-gcm]: https://en.wikipedia.org/wiki/Galois/Counter_Mode
[hkdf]: https://en.wikipedia.org/wiki/HKDF
[pbkdf2]: https://en.wikipedia.org/wiki/PBKDF2
[sha2]: https://en.wikipedia.org/wiki/SHA-2
[tls]: https://en.wikipedia.org/wiki/Transport_Layer_Security

<!-- RFCs and Specifications -->
[rfc8032]: https://datatracker.ietf.org/doc/html/rfc8032
[rfc7748]: https://datatracker.ietf.org/doc/html/rfc7748
[rfc5869]: https://datatracker.ietf.org/doc/html/rfc5869
[rfc8018]: https://datatracker.ietf.org/doc/html/rfc8018
[nist-gcm]: https://csrc.nist.gov/publications/detail/sp/800-38d/final
[bip39]: https://en.bitcoin.it/wiki/BIP_0039
[bip39-spec]: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
[did-key]: https://w3c-ccg.github.io/did-method-key/
[did-key-spec]: https://w3c-ccg.github.io/did-method-key/

<!-- Technologies -->
[webrtc]: https://webrtc.org/
[turn]: https://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT
[wasm]: https://webassembly.org/
[sqlite]: https://www.sqlite.org/
[indexeddb]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

<!-- Libraries and Tools -->
[libp2p]: https://libp2p.io/
[dalek]: https://github.com/dalek-cryptography
[ed25519-dalek]: https://github.com/dalek-cryptography/curve25519-dalek/tree/main/ed25519-dalek
[x25519-dalek]: https://github.com/dalek-cryptography/curve25519-dalek/tree/main/x25519-dalek
[aes-gcm-crate]: https://github.com/RustCrypto/AEADs/tree/master/aes-gcm
[hkdf-crate]: https://github.com/RustCrypto/KDFs/tree/master/hkdf
[sha2-crate]: https://github.com/RustCrypto/hashes/tree/master/sha2
[zeroize]: https://github.com/RustCrypto/utils/tree/master/zeroize
[rusqlite]: https://github.com/rusqlite/rusqlite
[sqljs]: https://sql.js.org/
[tauri]: https://tauri.app/
[expo]: https://expo.dev/
[wasm-pack]: https://rustwasm.github.io/wasm-pack/
[letsencrypt]: https://letsencrypt.org/
