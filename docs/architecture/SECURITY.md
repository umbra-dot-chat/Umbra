# Umbra Core Security Architecture

This document provides a comprehensive security overview of Umbra Core for audit purposes.

## Table of Contents

1. [Cryptographic Foundations](#cryptographic-foundations)
2. [Key Management](#key-management)
3. [Identity System](#identity-system)
4. [Message Encryption](#message-encryption)
5. [Transport Security](#transport-security)
6. [Storage Security](#storage-security)
7. [Threat Model](#threat-model)
8. [Security Considerations](#security-considerations)

---

## 1. Cryptographic Foundations

### Algorithm Selection

| Purpose | Algorithm | Key Size | Security Level |
|---------|-----------|----------|----------------|
| Digital Signatures | Ed25519 | 256-bit | 128-bit |
| Key Exchange | X25519 | 256-bit | 128-bit |
| Symmetric Encryption | AES-256-GCM | 256-bit | 256-bit |
| Key Derivation | HKDF-SHA256 | Variable | 256-bit |
| Recovery Phrase | BIP39 | 256-bit entropy | 256-bit |

### Why These Algorithms?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ALGORITHM RATIONALE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ed25519 (Signatures)                                                      │
│  ────────────────────                                                       │
│  • Designed by Daniel J. Bernstein (djb) - renowned cryptographer          │
│  • Deterministic: No RNG needed during signing (no nonce reuse risk)       │
│  • Fast: ~50,000 signatures/second on modern hardware                      │
│  • Compact: 64-byte signatures, 32-byte public keys                        │
│  • Widely audited and deployed (Tor, SSH, etc.)                            │
│                                                                             │
│  X25519 (Key Exchange)                                                     │
│  ─────────────────────                                                      │
│  • Same curve as Ed25519 (Curve25519)                                      │
│  • Constant-time implementation prevents timing attacks                     │
│  • No cofactor issues (safe curve)                                         │
│  • Used by: Tor, SSH, Noise Protocol, WireGuard                            │
│                                                                             │
│  AES-256-GCM (Encryption)                                                  │
│  ────────────────────────                                                   │
│  • NIST-approved, widely standardized                                      │
│  • Authenticated encryption (AEAD): confidentiality + integrity            │
│  • Hardware acceleration on most CPUs (AES-NI)                             │
│  • Constant-time implementations available                                 │
│                                                                             │
│  HKDF-SHA256 (Key Derivation)                                              │
│  ────────────────────────────                                               │
│  • RFC 5869 standardized                                                   │
│  • Provably secure extract-then-expand paradigm                            │
│  • Allows domain separation via 'info' parameter                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Management

### Key Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY HIERARCHY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    ┌─────────────────────────────────┐                     │
│                    │      Recovery Phrase            │                     │
│                    │      (24 BIP39 words)           │                     │
│                    │                                 │                     │
│                    │  "abandon ability able ..."     │                     │
│                    │                                 │                     │
│                    │  256 bits of entropy            │                     │
│                    │  Checksum: 8 bits (SHA256)      │                     │
│                    └───────────────┬─────────────────┘                     │
│                                    │                                        │
│                                    │ PBKDF2-HMAC-SHA512                    │
│                                    │ salt="mnemonic"+passphrase            │
│                                    │ iterations=2048                       │
│                                    │                                        │
│                                    ▼                                        │
│                    ┌─────────────────────────────────┐                     │
│                    │      BIP39 Seed                 │                     │
│                    │      (512 bits)                 │                     │
│                    │                                 │                     │
│                    │  We use first 256 bits as       │                     │
│                    │  master seed                    │                     │
│                    └───────────────┬─────────────────┘                     │
│                                    │                                        │
│                                    │ HKDF-SHA256                           │
│                                    │                                        │
│              ┌─────────────────────┼─────────────────────┐                 │
│              │                     │                     │                 │
│              ▼                     ▼                     ▼                 │
│   ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐    │
│   │   Signing Key      │ │  Encryption Key    │ │   Storage Key      │    │
│   │   (Ed25519)        │ │  (X25519)          │ │   (AES-256)        │    │
│   │                    │ │                    │ │                    │    │
│   │ info="umbra-       │ │ info="umbra-       │ │ info="umbra-       │    │
│   │   signing-key-v1"  │ │   encryption-      │ │   storage-         │    │
│   │                    │ │   key-v1"          │ │   encryption-v1"   │    │
│   │ Used for:          │ │ Used for:          │ │ Used for:          │    │
│   │ • Identity proofs  │ │ • Key exchange     │ │ • Local DB         │    │
│   │ • Message signing  │ │ • E2E encryption   │ │   encryption       │    │
│   │ • DID derivation   │ │ • Shared secrets   │ │                    │    │
│   └────────────────────┘ └────────────────────┘ └────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Zeroization

All secret key material is zeroized when no longer needed:

```rust
// Using zeroize crate
#[derive(ZeroizeOnDrop)]
pub struct SigningKeyPair {
    secret: SigningKey,  // Zeroized when struct is dropped
}
```

---

## 3. Identity System

### DID:key Method

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DID:KEY DERIVATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ed25519 Public Key (32 bytes)                                             │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Prepend Multicodec Prefix                                          │   │
│  │                                                                     │   │
│  │  0xED 0x01 = Ed25519 public key                                    │   │
│  │                                                                     │   │
│  │  Result: [0xED, 0x01, ...32 bytes of public key...]               │   │
│  │          (34 bytes total)                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Base58btc Encode                                                   │   │
│  │                                                                     │   │
│  │  Result: "6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5QGF7vk..."             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Prepend Multibase Prefix + DID Method                              │   │
│  │                                                                     │   │
│  │  "z" = base58btc multibase prefix                                  │   │
│  │  "did:key:" = DID method                                           │   │
│  │                                                                     │   │
│  │  Result: "did:key:z6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5..."          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Properties:                                                               │
│  • Self-certifying: DID encodes the public key                            │
│  • Verifiable: Anyone can extract and verify the public key               │
│  • No registry: Works offline, no blockchain needed                       │
│  • Collision-resistant: Based on 256-bit public key                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Message Encryption

### End-to-End Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    E2E ENCRYPTION PROTOCOL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 1: Key Exchange (X25519 ECDH)                                 │   │
│  │                                                                     │   │
│  │  Alice's Private (a) × Bob's Public (B) = Shared Secret            │   │
│  │  Bob's Private (b) × Alice's Public (A) = Same Shared Secret       │   │
│  │                                                                     │   │
│  │  Mathematical basis: a×B = a×(b×G) = b×(a×G) = b×A                │   │
│  │  where G is the base point of Curve25519                           │   │
│  │                                                                     │   │
│  │  Shared Secret: 32 bytes                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 2: Key Derivation (HKDF-SHA256)                               │   │
│  │                                                                     │   │
│  │  HKDF(                                                             │   │
│  │    IKM = shared_secret,                                           │   │
│  │    salt = conversation_id,     ← Domain separation                │   │
│  │    info = "umbra-message-encryption-v1",                          │   │
│  │    L = 32 bytes                                                   │   │
│  │  )                                                                 │   │
│  │                                                                     │   │
│  │  Result: 256-bit symmetric encryption key                          │   │
│  │                                                                     │   │
│  │  Note: Different conversations derive different keys               │   │
│  │        even with same shared secret                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 3: Nonce Generation                                           │   │
│  │                                                                     │   │
│  │  nonce = random(12 bytes)  ← From OS CSPRNG                        │   │
│  │                                                                     │   │
│  │  CRITICAL: Never reuse a nonce with the same key!                  │   │
│  │                                                                     │   │
│  │  With random nonces, collision probability after N messages:       │   │
│  │  P ≈ N² / 2^97 (birthday bound)                                   │   │
│  │                                                                     │   │
│  │  Safe up to ~2^32 messages per conversation                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 4: Encryption (AES-256-GCM)                                   │   │
│  │                                                                     │   │
│  │  ciphertext, tag = AES-256-GCM(                                    │   │
│  │    key = derived_key,                                             │   │
│  │    nonce = random_nonce,                                          │   │
│  │    plaintext = message,                                           │   │
│  │    aad = sender_did || recipient_did || timestamp                 │   │
│  │  )                                                                 │   │
│  │                                                                     │   │
│  │  AAD (Additional Authenticated Data):                              │   │
│  │  • Not encrypted, but authenticated                               │   │
│  │  • Binds ciphertext to specific sender/recipient/time             │   │
│  │  • Prevents message replay or misdirection                        │   │
│  │                                                                     │   │
│  │  Output:                                                           │   │
│  │  • Ciphertext: Same length as plaintext                           │   │
│  │  • Auth Tag: 16 bytes (128-bit authentication)                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 5: Signing (Ed25519)                                          │   │
│  │                                                                     │   │
│  │  signature = Ed25519_Sign(                                         │   │
│  │    key = sender_signing_key,                                      │   │
│  │    message = nonce || ciphertext || tag                           │   │
│  │  )                                                                 │   │
│  │                                                                     │   │
│  │  Result: 64-byte signature                                         │   │
│  │                                                                     │   │
│  │  This provides:                                                    │   │
│  │  • Authenticity: Proves message is from claimed sender            │   │
│  │  • Non-repudiation: Sender cannot deny sending                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Message Envelope Format

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WIRE FORMAT (BINARY)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Offset   Size    Field                Description                         │
│  ────────────────────────────────────────────────────────────────────      │
│  0        1       version              Protocol version (0x01)             │
│  1        1       msg_type             Message type enum                   │
│  2        1       flags                Reserved for future use             │
│  3        1       reserved             Padding                             │
│  4        12      nonce                AES-GCM nonce                       │
│  16       2       ciphertext_len       Length of ciphertext (big-endian)   │
│  18       N       ciphertext           Encrypted payload + 16-byte tag     │
│  18+N     64      signature            Ed25519 signature                   │
│                                                                             │
│  Total size: 82 + N bytes (minimum 82 bytes for empty message)            │
│                                                                             │
│  Message Types:                                                            │
│  • 0x01: ChatMessage                                                       │
│  • 0x02: TypingIndicator                                                   │
│  • 0x03: ReadReceipt                                                       │
│  • 0x0A: FriendRequest                                                     │
│  • 0x0B: FriendResponse                                                    │
│  • 0x64: RelayedMessage (future mesh support)                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Transport Security

### libp2p Security Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TRANSPORT SECURITY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Layer 1: Noise Protocol (Noise_XX)                                 │   │
│  │                                                                     │   │
│  │  Handshake Pattern: XX (mutual authentication)                     │   │
│  │                                                                     │   │
│  │  → e                          (initiator sends ephemeral)          │   │
│  │  ← e, ee, s, es               (responder ephemeral + static)       │   │
│  │  → s, se                      (initiator static)                   │   │
│  │                                                                     │   │
│  │  Result: Two symmetric keys for bidirectional encryption           │   │
│  │                                                                     │   │
│  │  Properties:                                                       │   │
│  │  • Forward secrecy (ephemeral keys)                               │   │
│  │  • Mutual authentication                                          │   │
│  │  • Identity hiding (static keys encrypted)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Layer 2: Yamux (Stream Multiplexing)                               │   │
│  │                                                                     │   │
│  │  • Multiple logical streams over one connection                    │   │
│  │  • Flow control per stream                                         │   │
│  │  • No head-of-line blocking                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Why Double Encryption (Transport + Message)?                              │
│  ─────────────────────────────────────────────                              │
│                                                                             │
│  Transport (Noise)           Message (AES-GCM)                             │
│  • Protects in transit       • Protects at rest                           │
│  • Ephemeral keys            • Long-term keys                             │
│  • Forward secrecy           • Recipient-bound                            │
│  • Against network attacks   • Against storage leaks                      │
│                                                                             │
│  Even if transport is compromised (MITM with valid peer ID),              │
│  message content remains encrypted to the specific recipient.              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Storage Security

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STORAGE SECURITY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Private Key Storage                                                │   │
│  │                                                                     │   │
│  │  Platform          Storage                    Protection            │   │
│  │  ─────────────────────────────────────────────────────────────      │   │
│  │  iOS               Keychain                   Secure Enclave        │   │
│  │  Android           Keystore                   Hardware-backed       │   │
│  │  Web               IndexedDB                  WebCrypto             │   │
│  │  Desktop           OS Keyring                 OS-dependent          │   │
│  │                                                                     │   │
│  │  Keys are encrypted before storage on all platforms.               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Database Encryption                                                │   │
│  │                                                                     │   │
│  │  SQLite database encrypted with storage key derived from           │   │
│  │  user's identity keys.                                             │   │
│  │                                                                     │   │
│  │  storage_key = HKDF(                                               │   │
│  │    IKM = signing_key || encryption_key,                           │   │
│  │    info = "umbra-storage-encryption-v1"                           │   │
│  │  )                                                                 │   │
│  │                                                                     │   │
│  │  Encrypted tables:                                                 │   │
│  │  • friends (friend list with public keys)                         │   │
│  │  • conversations (conversation metadata)                          │   │
│  │  • messages (message content - already E2E encrypted)             │   │
│  │  • friend_requests (pending requests)                             │   │
│  │                                                                     │   │
│  │  Unencrypted tables:                                               │   │
│  │  • settings (non-sensitive preferences)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Threat Model

### Threats Addressed

| Threat | Mitigation |
|--------|------------|
| Eavesdropping (passive) | E2E encryption, transport encryption |
| Man-in-the-middle | Authenticated key exchange, signatures |
| Message tampering | AEAD (GCM tag), signatures |
| Message replay | Unique message IDs, timestamps in AAD |
| Identity spoofing | Ed25519 signatures, DID verification |
| Metadata leakage | Future: Mesh routing, onion routing |
| Device compromise | Secure key storage, optional passphrase |
| Lost device | Recovery phrase backup |
| Server compromise | No central server (P2P) |

### Threats NOT Addressed (Out of Scope)

| Threat | Notes |
|--------|-------|
| Endpoint compromise (keylogger) | Requires OS-level security |
| Traffic analysis | Metadata (who talks to whom) visible |
| Denial of service | Rate limiting, not currently implemented |
| Key compromise disclosure | No revocation mechanism yet |
| Quantum computing | Ed25519/X25519 not post-quantum |

---

## 8. Security Considerations

### Nonce Reuse Prevention

**Critical**: AES-GCM nonce reuse completely breaks security.

Mitigation:
- Random nonces generated from OS CSPRNG
- 12-byte (96-bit) nonces provide 2^48 messages before 50% collision probability
- Practical limit: ~4 billion messages per key is safe

### Forward Secrecy

**Current (V1)**: Static shared secret per friend pair
- Compromise of long-term keys reveals past messages

**Future (V2)**: Double Ratchet protocol
- New keys for each message
- Past messages protected even if keys leak

### Recovery Phrase Security

The recovery phrase is the single point of failure:
- 256 bits of entropy (24 words)
- PBKDF2 with 2048 iterations provides some brute-force resistance
- Users MUST keep it secret and backed up

### Side-Channel Considerations

- All dalek crates use constant-time operations
- No secret-dependent branches or memory access patterns
- WASM: May have timing leaks due to JIT, considered acceptable trade-off

---

## Cryptographic Library Versions

| Library | Version | Purpose |
|---------|---------|---------|
| ed25519-dalek | 2.1 | Digital signatures |
| x25519-dalek | 2.0 | Key exchange |
| aes-gcm | 0.10 | Symmetric encryption |
| hkdf | 0.12 | Key derivation |
| sha2 | 0.10 | Hashing |
| bip39 | 2.0 | Recovery phrases |
| rand | 0.8 | Random number generation |
| zeroize | 1.7 | Memory zeroization |

---

## Audit Checklist

- [ ] Review key derivation paths
- [ ] Verify nonce uniqueness in encryption
- [ ] Check for hardcoded keys or IVs
- [ ] Verify constant-time operations
- [ ] Review error handling (no secret leakage)
- [ ] Check key zeroization on drop
- [ ] Verify signature verification before decryption
- [ ] Review recovery phrase generation entropy
- [ ] Check secure storage implementation per platform
- [ ] Verify AAD construction prevents message reuse
