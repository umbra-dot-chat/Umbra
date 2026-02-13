/**
 * Crypto utilities for the test bot.
 *
 * Mirrors the Umbra WASM core's cryptography:
 *   - Ed25519 signing keypair (identity / DID)
 *   - X25519 encryption keypair (ECDH key agreement)
 *   - AES-256-GCM message encryption/decryption
 *   - Deterministic conversation ID generation
 */

import { ed25519 } from '@noble/curves/ed25519';
import { x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Identity
// ─────────────────────────────────────────────────────────────────────────────

export interface BotIdentity {
  /** DID (did:key:z6Mk...) */
  did: string;
  /** Display name */
  displayName: string;
  /** Ed25519 signing private key (hex) */
  signingPrivateKey: string;
  /** Ed25519 signing public key (hex) */
  signingPublicKey: string;
  /** X25519 encryption private key (hex) */
  encryptionPrivateKey: string;
  /** X25519 encryption public key (hex) */
  encryptionPublicKey: string;
}

/**
 * Generate a new bot identity with Ed25519 + X25519 keypairs.
 *
 * The DID is derived from the Ed25519 public key using the did:key method,
 * matching the Umbra core's approach (multicodec ed25519-pub + base58btc).
 */
export function createIdentity(displayName: string): BotIdentity {
  // Ed25519 signing keypair
  const signingPrivate = ed25519.utils.randomPrivateKey();
  const signingPublic = ed25519.getPublicKey(signingPrivate);

  // X25519 encryption keypair (separate from signing)
  const encryptionPrivate = x25519.utils.randomPrivateKey();
  const encryptionPublic = x25519.getPublicKey(encryptionPrivate);

  // Build DID from Ed25519 public key
  // did:key uses multicodec prefix 0xed01 for ed25519-pub
  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const didBytes = new Uint8Array(multicodecPrefix.length + signingPublic.length);
  didBytes.set(multicodecPrefix);
  didBytes.set(signingPublic, multicodecPrefix.length);
  const did = `did:key:z${base58btcEncode(didBytes)}`;

  return {
    did,
    displayName,
    signingPrivateKey: bytesToHex(signingPrivate),
    signingPublicKey: bytesToHex(signingPublic),
    encryptionPrivateKey: bytesToHex(encryptionPrivate),
    encryptionPublicKey: bytesToHex(encryptionPublic),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Encryption (X25519 ECDH + AES-256-GCM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encrypt a message for a friend using X25519 ECDH + AES-256-GCM.
 *
 * The shared secret is derived from our encryption private key and the
 * friend's encryption public key. The AES key is SHA-256(shared_secret).
 */
export function encryptMessage(
  plaintext: string,
  myEncryptionPrivateKey: string,
  friendEncryptionPublicKey: string,
  senderDid: string,
  recipientDid: string,
  timestamp: number,
): { ciphertext: string; nonce: string } {
  // ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(
    hexToBytes(myEncryptionPrivateKey),
    hexToBytes(friendEncryptionPublicKey),
  );

  // Derive AES key = SHA-256(shared_secret)
  const aesKey = sha256(sharedSecret);

  // Random 12-byte nonce
  const nonce = randomBytes(12);

  // AAD = senderDid + recipientDid + timestamp (matching Rust core)
  const encoder = new TextEncoder();
  const aad = encoder.encode(`${senderDid}${recipientDid}${timestamp}`);

  // Encrypt with AES-256-GCM
  const cipher = gcm(aesKey, nonce, aad);
  const plaintextBytes = encoder.encode(plaintext);
  const ciphertextBytes = cipher.encrypt(plaintextBytes);

  return {
    ciphertext: Buffer.from(ciphertextBytes).toString('base64'),
    nonce: bytesToHex(nonce),
  };
}

/**
 * Decrypt a message from a friend using X25519 ECDH + AES-256-GCM.
 */
export function decryptMessage(
  ciphertextBase64: string,
  nonceHex: string,
  myEncryptionPrivateKey: string,
  senderEncryptionPublicKey: string,
  senderDid: string,
  recipientDid: string,
  timestamp: number,
): string {
  // ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(
    hexToBytes(myEncryptionPrivateKey),
    hexToBytes(senderEncryptionPublicKey),
  );

  // Derive AES key
  const aesKey = sha256(sharedSecret);

  const nonce = hexToBytes(nonceHex);
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  // AAD must match what the sender used
  const encoder = new TextEncoder();
  const aad = encoder.encode(`${senderDid}${recipientDid}${timestamp}`);

  const cipher = gcm(aesKey, nonce, aad);
  const plaintext = cipher.decrypt(new Uint8Array(ciphertext));

  return new TextDecoder().decode(plaintext);
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation ID (deterministic)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the deterministic conversation ID for a DM between two DIDs.
 * Both sides compute the same ID: SHA-256(sorted_did_a | sorted_did_b) as hex.
 */
export function computeConversationId(didA: string, didB: string): string {
  const sorted = [didA, didB].sort();
  const input = `${sorted[0]}|${sorted[1]}`;
  const hash = sha256(new TextEncoder().encode(input));
  return bytesToHex(hash);
}

// ─────────────────────────────────────────────────────────────────────────────
// Signing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign data with Ed25519.
 */
export function sign(data: Uint8Array, privateKeyHex: string): string {
  const sig = ed25519.sign(data, hexToBytes(privateKeyHex));
  return bytesToHex(sig);
}

// ─────────────────────────────────────────────────────────────────────────────
// Base58btc encoding (for DID generation)
// ─────────────────────────────────────────────────────────────────────────────

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58btcEncode(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  // Leading zeros
  let output = '';
  for (const byte of bytes) {
    if (byte === 0) output += BASE58_ALPHABET[0];
    else break;
  }
  // Digits are in reverse order
  for (let i = digits.length - 1; i >= 0; i--) {
    output += BASE58_ALPHABET[digits[i]];
  }
  return output;
}

// ─────────────────────────────────────────────────────────────────────────────
// UUID generation
// ─────────────────────────────────────────────────────────────────────────────

export function uuid(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = bytesToHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}
