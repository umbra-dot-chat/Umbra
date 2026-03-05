/**
 * File-based sync utility for multi-device Detox E2E tests.
 *
 * Two Detox processes (User A on iPhone 17 Pro, User B on iPhone 17 Pro Max)
 * coordinate via a shared JSON file at /tmp/umbra-e2e-sync.json.
 *
 * Usage:
 *   await writeSync('userA_did', 'did:key:z6Mk...');
 *   const did = await waitForSync('userA_did', 30000);
 */

import * as fs from 'fs';
import * as path from 'path';

const SYNC_FILE = '/tmp/umbra-e2e-sync.json';

/**
 * Read the entire sync state.
 */
function readSyncFile(): Record<string, string> {
  try {
    if (!fs.existsSync(SYNC_FILE)) return {};
    const raw = fs.readFileSync(SYNC_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Write a key-value pair to the sync file.
 */
export function writeSync(key: string, value: string): void {
  const data = readSyncFile();
  data[key] = value;
  fs.writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Read a key from the sync file (returns undefined if not set).
 */
export function readSync(key: string): string | undefined {
  const data = readSyncFile();
  return data[key];
}

/**
 * Wait for a key to appear in the sync file. Polls every 500ms.
 */
export async function waitForSync(key: string, timeoutMs = 60000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = readSync(key);
    if (value !== undefined) return value;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`waitForSync('${key}') timed out after ${timeoutMs}ms`);
}

/**
 * Reset the sync file — call in beforeAll of the first test to run.
 */
export function resetSync(): void {
  fs.writeFileSync(SYNC_FILE, '{}', 'utf8');
}
