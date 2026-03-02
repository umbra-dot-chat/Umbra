/**
 * Cross-platform file picker utility.
 *
 * Web: Uses the HTML `<input type="file">` element + FileReader API.
 * Mobile: Placeholder — will need expo-document-picker or similar.
 *
 * @packageDocumentation
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PickedFile {
  /** Display filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type (e.g. 'application/pdf') */
  mimeType: string;
  /** File contents as base64-encoded string */
  dataBase64: string;
}

/**
 * A lightweight handle returned immediately after the user picks a file.
 * Contains metadata only — call `readFileAsBase64` to get the data.
 */
export interface PickedFileHandle {
  /** Display filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type (e.g. 'application/pdf') */
  mimeType: string;
  /** Native File object (web only). Use with `readFileAsBase64`. */
  file: File;
}

// ---------------------------------------------------------------------------
// Base64 conversion (chunked, with progress)
// ---------------------------------------------------------------------------

/**
 * Convert an ArrayBuffer to a base64 string in yielding chunks.
 *
 * Processes ~768 KB at a time (divisible by 3 so each chunk produces
 * valid base64 without padding except the very last one). Yields to
 * the event loop between chunks so the UI thread stays responsive and
 * progress callbacks can drive a progress bar.
 */
async function arrayBufferToBase64(
  buffer: ArrayBuffer,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const total = bytes.length;

  // 768 KB per chunk — divisible by 3 so btoa produces clean output
  const CHUNK_SIZE = 786432; // 768 * 1024
  // Sub-batch size for String.fromCharCode (stay well under call-stack limit)
  const BATCH = 8192;

  const parts: string[] = [];
  let offset = 0;

  while (offset < total) {
    const end = Math.min(offset + CHUNK_SIZE, total);
    const chunk = bytes.subarray(offset, end);

    // Build binary string in small batches to avoid stack overflow
    const binaryParts: string[] = [];
    for (let i = 0; i < chunk.length; i += BATCH) {
      const slice = chunk.subarray(i, Math.min(i + BATCH, chunk.length));
      binaryParts.push(String.fromCharCode.apply(null, slice as unknown as number[]));
    }
    parts.push(btoa(binaryParts.join('')));

    offset = end;
    onProgress?.(offset / total);

    // Yield to the event loop so React can re-render the progress bar
    await new Promise<void>((r) => setTimeout(r, 0));
  }

  return parts.join('');
}

// ---------------------------------------------------------------------------
// Web implementation
// ---------------------------------------------------------------------------

/**
 * Open the browser file dialog and return the raw File handle(s) with
 * metadata. Does NOT read file contents — use `readFileAsBase64` for that.
 */
function pickFileHandleWeb(multiple: boolean): Promise<PickedFileHandle[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const files = input.files;
      if (!files || files.length === 0) {
        resolve(null);
        return;
      }

      const results: PickedFileHandle[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        results.push({
          filename: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          file,
        });
      }
      document.body.removeChild(input);
      resolve(results);
    });

    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
  });
}

function pickFileWeb(multiple: boolean): Promise<PickedFile[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const files = input.files;
      if (!files || files.length === 0) {
        resolve(null);
        return;
      }

      try {
        const results: PickedFile[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataBase64 = await readFileAsBase64(file);
          results.push({
            filename: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            dataBase64,
          });
        }
        resolve(results);
      } catch {
        resolve(null);
      } finally {
        document.body.removeChild(input);
      }
    });

    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Read a File as base64 with real progress reporting.
 *
 * Phase 1 (10%): Read the raw bytes from disk via `file.arrayBuffer()`.
 * Phase 2 (90%): Convert to base64 in yielding ~768 KB chunks — this is
 *   where the real work happens and where progress ticks come from.
 *
 * The chunked approach keeps the main thread responsive so React can
 * re-render the progress bar between each chunk.
 */
export async function readFileAsBase64(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  // Phase 1: Read raw bytes into memory (fast on SSD, ~10% of total time)
  const buffer = await file.arrayBuffer();
  onProgress?.(0.1);

  // Phase 2: Convert to base64 in chunks with progress (the slow part)
  const base64 = await arrayBufferToBase64(buffer, (chunkFraction) => {
    // Map chunk progress 0→1 to overall progress 0.1→1.0
    onProgress?.(0.1 + chunkFraction * 0.9);
  });

  return base64;
}

// ---------------------------------------------------------------------------
// Mobile implementation (placeholder)
// ---------------------------------------------------------------------------

async function pickFileMobile(_multiple: boolean): Promise<PickedFile[] | null> {
  // TODO: Integrate with expo-document-picker
  console.warn('[filePicker] File picking not yet implemented on mobile. Use expo-document-picker.');
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Open a file picker dialog and return the selected file.
 * Returns null if the user cancels.
 */
export async function pickFile(): Promise<PickedFile | null> {
  if (Platform.OS === 'web') {
    const results = await pickFileWeb(false);
    return results && results.length > 0 ? results[0] : null;
  }
  const results = await pickFileMobile(false);
  return results && results.length > 0 ? results[0] : null;
}

/**
 * Open a file picker and return a lightweight handle with metadata only.
 * The file data is NOT read yet — call `readFileAsBase64(handle.file)`
 * separately so you can show a progress bar during the read.
 *
 * Returns null if the user cancels.
 */
export async function pickFileHandle(): Promise<PickedFileHandle | null> {
  if (Platform.OS === 'web') {
    const results = await pickFileHandleWeb(false);
    return results && results.length > 0 ? results[0] : null;
  }
  // Mobile: fall back to full pick (TODO: split when expo-document-picker is integrated)
  return null;
}

/**
 * Open a file picker dialog allowing multiple file selection.
 * Returns null if the user cancels.
 */
export async function pickMultipleFiles(): Promise<PickedFile[] | null> {
  if (Platform.OS === 'web') {
    return pickFileWeb(true);
  }
  return pickFileMobile(true);
}
