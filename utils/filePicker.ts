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

// ---------------------------------------------------------------------------
// Web implementation
// ---------------------------------------------------------------------------

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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(result);
      // Convert to base64
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      resolve(btoa(binary));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
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
 * Open a file picker dialog allowing multiple file selection.
 * Returns null if the user cancels.
 */
export async function pickMultipleFiles(): Promise<PickedFile[] | null> {
  if (Platform.OS === 'web') {
    return pickFileWeb(true);
  }
  return pickFileMobile(true);
}
