/**
 * Persistent identity store for wisps.
 *
 * Generates Ed25519 + X25519 keypairs and DID identifiers,
 * following the same pattern as umbra-test-bot/crypto.ts.
 * Identities are saved per-wisp in the data directory.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ed25519 } from '@noble/curves/ed25519';
import { x25519 } from '@noble/curves/ed25519';
import { bytesToHex } from '@noble/curves/abstract/utils';

export interface WispIdentity {
  did: string;
  displayName: string;
  signingPrivateKey: string;
  signingPublicKey: string;
  encryptionPrivateKey: string;
  encryptionPublicKey: string;
}

/**
 * Load an existing wisp identity from disk, or create a new one.
 * Each wisp gets its own subdirectory under dataDir.
 */
export function loadOrCreateWispIdentity(
  dataDir: string,
  name: string,
): WispIdentity {
  const wispDir = join(dataDir, name);
  const identityPath = join(wispDir, 'identity.json');

  if (existsSync(identityPath)) {
    const data = JSON.parse(
      readFileSync(identityPath, 'utf-8'),
    ) as WispIdentity;
    data.displayName = name;
    return data;
  }

  const identity = createWispIdentity(name);

  mkdirSync(wispDir, { recursive: true });
  writeFileSync(identityPath, JSON.stringify(identity, null, 2), 'utf-8');
  return identity;
}

/**
 * Generate a new wisp identity with Ed25519 + X25519 keypairs.
 * DID derived from Ed25519 public key using did:key method.
 */
function createWispIdentity(displayName: string): WispIdentity {
  const signingPrivate = ed25519.utils.randomPrivateKey();
  const signingPublic = ed25519.getPublicKey(signingPrivate);

  const encryptionPrivate = x25519.utils.randomPrivateKey();
  const encryptionPublic = x25519.getPublicKey(encryptionPrivate);

  // did:key multicodec prefix 0xed01 for ed25519-pub
  const prefix = new Uint8Array([0xed, 0x01]);
  const didBytes = new Uint8Array(prefix.length + signingPublic.length);
  didBytes.set(prefix);
  didBytes.set(signingPublic, prefix.length);
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

// Base58btc encoder — matches umbra-test-bot/crypto.ts
const BASE58 =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

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
  let output = '';
  for (const byte of bytes) {
    if (byte === 0) output += BASE58[0];
    else break;
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    output += BASE58[digits[i]];
  }
  return output;
}
