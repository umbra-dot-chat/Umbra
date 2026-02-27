/**
 * Call signaling encryption/decryption helpers.
 *
 * Wraps the WASM-level X25519+AES-256-GCM primitives to encrypt/decrypt
 * call signaling payloads (SDP offers, answers, ICE candidates, etc.)
 * so the relay server cannot read call metadata.
 */

import { getWasm } from '@umbra/wasm';

// ─── Encrypt a call signaling payload for a peer ─────────────────────────────

/**
 * Encrypt an arbitrary signaling payload for a specific peer.
 *
 * @param peerDid - The recipient's DID (must be a friend in the database)
 * @param payload - The plaintext payload object to encrypt
 * @param context - Optional context string for key derivation (e.g. callId)
 * @returns Encrypted ciphertext (base64) + nonce (hex) + timestamp
 */
export async function encryptSignal(
  peerDid: string,
  payload: object,
  context?: string,
): Promise<{ ciphertext: string; nonce: string; timestamp: number }> {
  const wasm = await getWasm();
  if (!wasm) throw new Error('WASM module not loaded');

  // Serialize payload to JSON, then base64-encode
  const plaintext = JSON.stringify(payload);
  const plaintextB64 = btoa(
    new TextEncoder()
      .encode(plaintext)
      .reduce((s, b) => s + String.fromCharCode(b), ''),
  );

  const inputJson = JSON.stringify({
    peer_did: peerDid,
    plaintext_b64: plaintextB64,
    ...(context ? { context } : {}),
  });

  const resultJson = wasm.umbra_wasm_crypto_encrypt_for_peer(inputJson);
  const result = JSON.parse(resultJson);

  return {
    ciphertext: result.ciphertext_b64,
    nonce: result.nonce_hex,
    timestamp: result.timestamp,
  };
}

// ─── Decrypt a call signaling payload from a peer ────────────────────────────

/**
 * Decrypt an encrypted signaling payload received from a peer.
 *
 * @param peerDid - The sender's DID
 * @param ciphertext - Base64-encoded ciphertext
 * @param nonce - Hex-encoded nonce
 * @param timestamp - Unix timestamp (ms) used in AAD binding
 * @param context - Optional context string for key derivation (e.g. callId)
 * @returns The decrypted payload object
 */
export async function decryptSignal<T = object>(
  peerDid: string,
  ciphertext: string,
  nonce: string,
  timestamp: number,
  context?: string,
): Promise<T> {
  const wasm = await getWasm();
  if (!wasm) throw new Error('WASM module not loaded');

  const inputJson = JSON.stringify({
    peer_did: peerDid,
    ciphertext_b64: ciphertext,
    nonce_hex: nonce,
    timestamp,
    ...(context ? { context } : {}),
  });

  const resultJson = wasm.umbra_wasm_crypto_decrypt_from_peer(inputJson);
  const result = JSON.parse(resultJson);

  // Decode base64 plaintext back to string, then parse JSON
  const bytes = Uint8Array.from(atob(result.plaintext_b64), (c) => c.charCodeAt(0));
  const plaintext = new TextDecoder().decode(bytes);

  return JSON.parse(plaintext) as T;
}

// ─── Feature detection ──────────────────────────────────────────────────────

/**
 * Check if the WASM peer encryption functions are available.
 * Falls back to unencrypted signaling if not.
 */
export async function isSignalEncryptionAvailable(): Promise<boolean> {
  try {
    const wasm = await getWasm();
    if (!wasm) return false;
    return (
      typeof wasm.umbra_wasm_crypto_encrypt_for_peer === 'function' &&
      typeof wasm.umbra_wasm_crypto_decrypt_from_peer === 'function'
    );
  } catch {
    return false;
  }
}
