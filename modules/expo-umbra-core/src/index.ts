/**
 * expo-umbra-core — Expo native module wrapping the Umbra Core Rust library.
 *
 * On iOS: calls into libumbra_core.a via C FFI
 * On Android: calls into libumbra_core.so via JNI
 *
 * All methods return JSON strings matching the WASM module interface,
 * so rn-backend.ts can map them 1:1 to the UmbraWasmModule contract.
 */

import { requireNativeModule, EventEmitter, type EventSubscription } from 'expo-modules-core';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UmbraCoreEvent {
  type: string;
  data: string;
}

export interface NativeUmbraCore {
  // ── Lifecycle ──────────────────────────────────────────────────────────────
  initialize(storagePath: string): string; // JSON FfiResult
  initDatabase(): string; // Opens SQLite DB at <storage_path>/umbra.db
  shutdown(): string;
  version(): string;

  // ── Identity ───────────────────────────────────────────────────────────────
  identityCreate(displayName: string): string; // JSON: { did, recovery_phrase }
  identityRestore(recoveryPhrase: string, displayName: string): string;
  identityGetDid(): string;
  identityGetProfile(): string; // JSON: { did, display_name, bio, avatar_url }
  identityUpdateProfile(json: string): string;

  // ── Network ────────────────────────────────────────────────────────────────
  networkStart(configJson: string | null): Promise<string>;
  networkStop(): Promise<string>;
  networkStatus(): string;
  networkConnect(addr: string): Promise<string>;

  // ── Discovery ──────────────────────────────────────────────────────────────
  discoveryGetConnectionInfo(): string;
  discoveryConnectWithInfo(info: string): Promise<string>;
  discoveryLookupPeer(did: string): Promise<string>;

  // ── Friends ────────────────────────────────────────────────────────────────
  friendsSendRequest(did: string, message: string | null): string;
  friendsAcceptRequest(requestId: string): string;
  friendsRejectRequest(requestId: string): string;
  friendsList(): string; // JSON array
  friendsPendingRequests(): string; // JSON array

  // ── Messaging ──────────────────────────────────────────────────────────────
  messagingSendText(recipientDid: string, text: string): Promise<string>;
  messagingGetConversations(): string; // JSON array
  messagingGetMessages(conversationId: string, limit: number, beforeId: string | null): string;

  // ── Generic Dispatcher ───────────────────────────────────────────────────
  /** Route any method through the Rust dispatcher. JSON in, JSON out. */
  call(method: string, args: string): Promise<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Require the native module. Returns null if not linked (allows graceful
 * fallback to stub backend during development).
 */
let _module: NativeUmbraCore | null = null;

export function getExpoUmbraCore(): NativeUmbraCore | null {
  if (_module) return _module;
  try {
    _module = requireNativeModule('ExpoUmbraCore') as NativeUmbraCore;
    return _module;
  } catch {
    // Module not linked yet — this is expected during development
    // before the native Rust library is compiled and linked.
    console.warn(
      '[expo-umbra-core] Native module not available. ' +
      'Run scripts/build-mobile.sh to compile the Rust library.'
    );
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Listener
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _emitter: any = null;

function getEmitter(): { addListener(name: string, cb: (event: UmbraCoreEvent) => void): EventSubscription } | null {
  if (_emitter) return _emitter;
  const mod = getExpoUmbraCore();
  if (!mod) return null;
  try {
    // As of Expo SDK 52+ the native module itself is an EventEmitter,
    // but we still call the constructor for backward compatibility.
    _emitter = new EventEmitter(mod as any);
    return _emitter;
  } catch {
    return null;
  }
}

/**
 * Subscribe to events from the Rust core (messages, friend requests, etc.).
 *
 * Events are emitted by Rust → C callback → Swift → Expo EventEmitter → here.
 *
 * @returns A Subscription that should be removed when no longer needed.
 */
export function addUmbraCoreEventListener(
  callback: (event: UmbraCoreEvent) => void
): EventSubscription | null {
  const emitter = getEmitter();
  if (!emitter) return null;
  return emitter.addListener('onUmbraCoreEvent', callback);
}

export default getExpoUmbraCore;
