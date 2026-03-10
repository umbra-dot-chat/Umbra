# Domain: Relay & Networking

## Overview

Umbra is peer-to-peer by design. The relay server exists for NAT traversal — when two peers can't establish a direct connection, traffic routes through the relay.

## Packages

| Package | Language | Purpose |
|---------|----------|---------|
| `umbra-relay` | Rust | Relay server for P2P fallback |
| `umbra-core` | Rust | Networking primitives, protocol definitions |
| `umbra-cli` | Rust | CLI for relay management and debugging |

## Architecture

```
Peer A ←─── direct P2P (preferred) ───→ Peer B
   │                                        │
   └──── relay (NAT traversal fallback) ────┘
              umbra-relay (Rust)
```

## Key Concepts

- **Peer discovery** — How peers find each other
- **NAT traversal** — STUN/TURN-style hole punching
- **Relay fallback** — When direct connection fails
- **End-to-end encryption** — Relay never sees plaintext (just encrypted blobs)

## WebRTC Signaling (Ghost AI Calls)

For AI calls via Ghost AI bot, signaling goes through the relay/signaling server:

1. Client creates WebRTC offer (SDP)
2. Offer sent to Ghost AI bot via signaling
3. Bot creates answer (SDP) with codec preferences
4. ICE candidates exchanged
5. DTLS-SRTP media stream established

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `ICE connection state: failed` | NAT/firewall blocking | Check TURN server config |
| High latency | Relay routing | Check direct P2P is being attempted first |
| Connection drops | Network change | ICE restart should handle this |

## Notes for Agents

- Relay code is Rust — changes require `cargo build`
- The relay is separate from the Ghost AI server
- All relay traffic is encrypted end-to-end; the relay is a dumb pipe
- WebRTC (for calls) uses its own ICE/DTLS transport, separate from the message relay
