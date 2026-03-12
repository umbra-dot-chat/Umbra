/**
 * Helper utilities for Umbra Service
 *
 * @packageDocumentation
 */

import { getWasm } from '@umbra/wasm';
import type { UmbraWasmModule } from '@umbra/wasm';
import { ErrorCode, UmbraError } from './errors';

// Debug bridge
const _dbg = (): any => (globalThis as any).__umbra_logger_instance;

/**
 * Convert snake_case keys to camelCase recursively.
 *
 * Rust returns `snake_case` JSON. TypeScript expects `camelCase`.
 */
export function snakeToCamel(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = snakeToCamel(value);
  }
  return result;
}

/**
 * Convert camelCase keys to snake_case for sending to Rust.
 */
export function camelToSnake(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = camelToSnake(value);
  }
  return result;
}

/**
 * Get the WASM module, throwing if not initialized.
 */
export function wasm(): UmbraWasmModule {
  const w = getWasm();
  if (!w) {
    throw new UmbraError(
      ErrorCode.NotInitialized,
      'WASM module not initialized. Call UmbraService.initialize() first.'
    );
  }
  return w;
}

/**
 * Parse a JSON string from WASM and convert snake_case keys to camelCase.
 *
 * Handles both synchronous (WASM) and asynchronous (Tauri IPC) return
 * values. When the backend is Tauri, `invoke()` returns a Promise, so
 * callers should always `await` this function.
 */
export async function parseWasm<T>(jsonOrJsValue: string | Promise<string> | { toString(): string }): Promise<T> {
  const resolved = await jsonOrJsValue;
  const str = typeof resolved === 'string' ? resolved : resolved.toString();
  _dbg()?.trace('service', `parseWasm: ${str.length} chars`, undefined, 'helpers');
  const raw = JSON.parse(str);
  return snakeToCamel(raw) as T;
}

/**
 * Wrap a WASM call with error conversion.
 */
export function wrapWasmError(fn: () => unknown): unknown {
  try {
    return fn();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new UmbraError(ErrorCode.Internal, message);
  }
}

/**
 * Encode a UTF-8 string to base64, safely handling Unicode characters
 * (emoji, accented chars, CJK, etc.) that would cause `btoa()` to throw
 * `DOMException: The string contains characters outside of the Latin1 range`.
 */
export function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16)),
    ),
  );
}

/**
 * Decode a base64 string back to a UTF-8 string.
 * Reverse of `utf8ToBase64`.
 */
export function base64ToUtf8(b64: string): string {
  return decodeURIComponent(
    Array.from(atob(b64), (c) =>
      '%' + c.charCodeAt(0).toString(16).padStart(2, '0'),
    ).join(''),
  );
}
