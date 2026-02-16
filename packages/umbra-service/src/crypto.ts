/**
 * Cryptographic operations module
 *
 * @packageDocumentation
 */

import { wasm } from './helpers';

/**
 * Sign data with the current identity's key
 *
 * @param data - Data to sign
 * @returns 64-byte Ed25519 signature
 */
export async function sign(data: Uint8Array): Promise<Uint8Array> {
  return await wasm().umbra_wasm_crypto_sign(data);
}

/**
 * Verify a signature
 *
 * @param publicKeyHex - Ed25519 public key (hex)
 * @param data - Original data
 * @param signature - 64-byte signature
 * @returns true if valid
 */
export async function verify(
  publicKeyHex: string,
  data: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  return await wasm().umbra_wasm_crypto_verify(publicKeyHex, data, signature);
}
