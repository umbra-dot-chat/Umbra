/**
 * Crypto utilities for wisps messaging.
 *
 * Mirrors the Umbra protocol's encryption:
 *   - X25519 ECDH key agreement + AES-256-GCM
 *   - Deterministic conversation ID (SHA-256 of sorted DIDs)
 *   - UUID v4 generation
 *
 * Copied from @umbra/test-bot/crypto.ts to avoid cross-package
 * TypeScript compilation issues (test-bot has no build step).
 */

import { x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';
import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';

/**
 * Encrypt a message using X25519 ECDH + HKDF-SHA256 + AES-256-GCM.
 */
export function encryptMessage(
  plaintext: string,
  myEncryptionPrivateKey: string,
  friendEncryptionPublicKey: string,
  senderDid: string,
  recipientDid: string,
  timestamp: number,
  conversationId: string,
): { ciphertext: string; nonce: string } {
  const sharedSecret = x25519.getSharedSecret(
    hexToBytes(myEncryptionPrivateKey),
    hexToBytes(friendEncryptionPublicKey),
  );
  const salt = new TextEncoder().encode(conversationId);
  const aesKey = hkdf(sha256, sharedSecret, salt, 'umbra-message-encryption-v1', 32);
  const nonce = randomBytes(12);
  const aad = new TextEncoder().encode(`${senderDid}${recipientDid}${timestamp}`);
  const cipher = gcm(aesKey, nonce, aad);
  const ciphertextBytes = cipher.encrypt(new TextEncoder().encode(plaintext));

  return {
    ciphertext: Buffer.from(ciphertextBytes).toString('base64'),
    nonce: bytesToHex(nonce),
  };
}

/**
 * Decrypt a message using X25519 ECDH + HKDF-SHA256 + AES-256-GCM.
 */
export function decryptMessage(
  ciphertextBase64: string,
  nonceHex: string,
  myEncryptionPrivateKey: string,
  senderEncryptionPublicKey: string,
  senderDid: string,
  recipientDid: string,
  timestamp: number,
  conversationId: string,
): string {
  const sharedSecret = x25519.getSharedSecret(
    hexToBytes(myEncryptionPrivateKey),
    hexToBytes(senderEncryptionPublicKey),
  );
  const salt = new TextEncoder().encode(conversationId);
  const aesKey = hkdf(sha256, sharedSecret, salt, 'umbra-message-encryption-v1', 32);
  const nonce = hexToBytes(nonceHex);
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const aad = new TextEncoder().encode(`${senderDid}${recipientDid}${timestamp}`);
  const cipher = gcm(aesKey, nonce, aad);
  const plaintext = cipher.decrypt(new Uint8Array(ciphertext));
  return new TextDecoder().decode(plaintext);
}

/**
 * Encrypt a raw key using ECDH shared secret (for group key exchange).
 */
export function encryptGroupKey(
  groupKeyHex: string,
  myEncryptionPrivateKey: string,
  recipientEncryptionPublicKey: string,
): { ciphertext: string; nonce: string } {
  const sharedSecret = x25519.getSharedSecret(
    hexToBytes(myEncryptionPrivateKey),
    hexToBytes(recipientEncryptionPublicKey),
  );
  const salt = new TextEncoder().encode('umbra-group-key-exchange');
  const aesKey = hkdf(sha256, sharedSecret, salt, 'umbra-group-key-v1', 32);
  const nonce = randomBytes(12);
  const cipher = gcm(aesKey, nonce);
  const ciphertextBytes = cipher.encrypt(hexToBytes(groupKeyHex));
  return {
    ciphertext: Buffer.from(ciphertextBytes).toString('base64'),
    nonce: bytesToHex(nonce),
  };
}

/**
 * Decrypt a raw key using ECDH shared secret (for group key exchange).
 */
export function decryptGroupKey(
  ciphertextBase64: string,
  nonceHex: string,
  myEncryptionPrivateKey: string,
  senderEncryptionPublicKey: string,
): string {
  const sharedSecret = x25519.getSharedSecret(
    hexToBytes(myEncryptionPrivateKey),
    hexToBytes(senderEncryptionPublicKey),
  );
  const salt = new TextEncoder().encode('umbra-group-key-exchange');
  const aesKey = hkdf(sha256, sharedSecret, salt, 'umbra-group-key-v1', 32);
  const nonce = hexToBytes(nonceHex);
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const cipher = gcm(aesKey, nonce);
  const plaintext = cipher.decrypt(new Uint8Array(ciphertext));
  return bytesToHex(plaintext);
}

/**
 * Encrypt a message using a symmetric AES-256-GCM key (for group messages).
 */
export function encryptGroupMessage(
  plaintext: string,
  groupKeyHex: string,
): { ciphertext: string; nonce: string } {
  const key = hexToBytes(groupKeyHex);
  const nonce = randomBytes(12);
  const cipher = gcm(key, nonce);
  const ciphertextBytes = cipher.encrypt(new TextEncoder().encode(plaintext));
  return {
    ciphertext: Buffer.from(ciphertextBytes).toString('base64'),
    nonce: bytesToHex(nonce),
  };
}

/**
 * Decrypt a message using a symmetric AES-256-GCM key (for group messages).
 */
export function decryptGroupMessage(
  ciphertextBase64: string,
  nonceHex: string,
  groupKeyHex: string,
): string {
  const key = hexToBytes(groupKeyHex);
  const nonce = hexToBytes(nonceHex);
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const cipher = gcm(key, nonce);
  const plaintext = cipher.decrypt(new Uint8Array(ciphertext));
  return new TextDecoder().decode(plaintext);
}

/**
 * Deterministic conversation ID: SHA-256(sorted_did_a | sorted_did_b).
 */
export function computeConversationId(didA: string, didB: string): string {
  const sorted = [didA, didB].sort();
  const input = `${sorted[0]}|${sorted[1]}`;
  const hash = sha256(new TextEncoder().encode(input));
  return bytesToHex(hash);
}

/**
 * Generate a UUID v4.
 */
export function uuid(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}
