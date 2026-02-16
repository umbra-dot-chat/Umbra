/**
 * Helper utilities for Umbra Service
 *
 * @packageDocumentation
 */

import { getWasm } from '@umbra/wasm';
import type { UmbraWasmModule } from '@umbra/wasm';
import { ErrorCode, UmbraError } from './errors';

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
