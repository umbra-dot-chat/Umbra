/**
 * Identity management module
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import { ErrorCode, UmbraError } from './errors';
import type { Identity, PublicIdentity, CreateIdentityResult, ProfileUpdate } from './types';

/**
 * Create a new identity
 *
 * Generates a new cryptographic identity with a recovery phrase.
 *
 * ## IMPORTANT
 *
 * The recovery phrase should be displayed to the user ONCE and they
 * should be instructed to write it down. It cannot be recovered later!
 *
 * @param displayName - User's display name
 * @returns Identity and recovery phrase
 */
export async function createIdentity(displayName: string): Promise<CreateIdentityResult> {
  const resultJson = wasm().umbra_wasm_identity_create(displayName);
  const result = await parseWasm<{ did: string; recoveryPhrase: string }>(resultJson);

  // Get full profile info after creation
  const profileJson = wasm().umbra_wasm_identity_get_profile();
  const profile = await parseWasm<{
    did: string;
    displayName: string;
    status?: string;
    avatar?: string;
  }>(profileJson);

  return {
    identity: {
      did: result.did,
      displayName: profile.displayName,
      status: profile.status ?? undefined,
      avatar: profile.avatar ?? undefined,
      createdAt: Date.now() / 1000,
    },
    recoveryPhrase: result.recoveryPhrase.split(' '),
  };
}

/**
 * Restore identity from recovery phrase
 *
 * @param recoveryPhrase - 24-word recovery phrase
 * @param displayName - Display name for the identity
 * @returns Restored identity
 *
 * @throws {UmbraError} If recovery phrase is invalid
 */
export async function restoreIdentity(
  recoveryPhrase: string[],
  displayName: string
): Promise<Identity> {
  if (recoveryPhrase.length !== 24) {
    throw new UmbraError(
      ErrorCode.InvalidRecoveryPhrase,
      `Expected 24 words, got ${recoveryPhrase.length}`
    );
  }

  const phrase = recoveryPhrase.join(' ');
  const did = await wasm().umbra_wasm_identity_restore(phrase, displayName);

  return {
    did,
    displayName,
    createdAt: Date.now() / 1000,
  };
}

/**
 * Load existing identity from storage
 *
 * @returns Identity if one exists, null otherwise
 */
export async function loadIdentity(): Promise<Identity | null> {
  try {
    const did = await wasm().umbra_wasm_identity_get_did();
    if (!did) return null;

    const profileJson = wasm().umbra_wasm_identity_get_profile();
    const profile = await parseWasm<{
      did: string;
      displayName: string;
      status?: string;
      avatar?: string;
    }>(profileJson);

    return {
      did: profile.did,
      displayName: profile.displayName,
      status: profile.status ?? undefined,
      avatar: profile.avatar ?? undefined,
      createdAt: Date.now() / 1000,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current identity
 *
 * @throws {UmbraError} If no identity is loaded
 */
export async function getIdentity(): Promise<Identity> {
  const identity = await loadIdentity();
  if (!identity) {
    throw new UmbraError(
      ErrorCode.NoIdentity,
      'No identity loaded. Create or restore an identity first.'
    );
  }
  return identity;
}

/**
 * Update profile information
 *
 * @param update - Profile update
 */
export async function updateProfile(update: ProfileUpdate): Promise<void> {
  const json: Record<string, unknown> = {};
  switch (update.type) {
    case 'displayName':
      json.display_name = update.value;
      break;
    case 'status':
      json.status = update.value;
      break;
    case 'avatar':
      json.avatar = update.value;
      break;
  }
  await wasm().umbra_wasm_identity_update_profile(JSON.stringify(json));
}

/**
 * Get public identity for sharing
 *
 * Returns the public portion of the identity that can be safely
 * shared with others.
 */
export async function getPublicIdentity(): Promise<PublicIdentity> {
  const profileJson = wasm().umbra_wasm_identity_get_profile();
  const profile = await parseWasm<{
    did: string;
    displayName: string;
    status?: string;
    avatar?: string;
  }>(profileJson);

  return {
    did: profile.did,
    displayName: profile.displayName,
    status: profile.status ?? undefined,
    avatar: profile.avatar ?? undefined,
    publicKeys: {
      signing: '', // TODO: expose public keys via WASM
      encryption: '',
    },
    createdAt: Date.now() / 1000,
  };
}
