# Domain: Cryptography & Identity

## Overview

All cryptography lives in `umbra-core` (Rust). JavaScript code NEVER handles raw crypto operations — it calls into Rust via WASM (web) or FFI (mobile).

## Cryptographic Primitives

| Algorithm | Standard | Purpose |
|-----------|----------|---------|
| X25519 | RFC 7748 | Key exchange (Diffie-Hellman) |
| AES-256-GCM | NIST SP 800-38D | Symmetric encryption |
| Ed25519 | RFC 8032 | Digital signatures |
| HKDF-SHA256 | RFC 5869 | Key derivation |
| BIP-39 | Bitcoin standard | Recovery phrases (mnemonic seeds) |

## Identity System

- **DID:key** — Self-certifying decentralized identifiers (W3C standard)
- Each user has an Ed25519 keypair
- Public key → DID:key identifier
- No central authority needed for identity verification

## Memory Safety

- `ZeroizeOnDrop` trait on all secret material (keys zeroized when dropped)
- No plaintext secrets ever written to disk
- Rust ownership model prevents use-after-free on key material

## Key Packages

| Package | Language | Role |
|---------|----------|------|
| `umbra-core` | Rust | Core crypto library |
| `umbra-wasm` | Rust→WASM | Browser bridge (web) |
| `umbra-service` | TypeScript | JS API layer over core |
| `modules/expo-umbra-core` | Native module | Mobile bridge (iOS/Android FFI) |

## Data Flow: Encryption

```
Plaintext message (JS)
  → @umbra/service.encrypt(plaintext, recipientDID)
  → umbra-core (Rust):
      1. Look up recipient's X25519 public key
      2. X25519 key exchange → shared secret
      3. HKDF-SHA256 derive AES key
      4. AES-256-GCM encrypt
      5. Return ciphertext + nonce
  → Send encrypted payload over wire
```

## Rules for Agents

1. **NEVER implement crypto in JavaScript.** All crypto goes through umbra-core.
2. **NEVER log or write key material.** Use `ZeroizeOnDrop`.
3. **Test crypto changes in Rust first** before touching the JS bridge.
4. **Recovery phrases (BIP-39) are ultra-sensitive.** Never display in logs or transmit unencrypted.
