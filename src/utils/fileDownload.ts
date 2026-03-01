/**
 * fileDownload — Web-specific download helper for base64-encoded files.
 *
 * Converts a base64 data string into a Blob, creates a temporary Object URL,
 * and programmatically triggers a download via an invisible anchor element.
 *
 * Used by both the file-channel view (community files) and DM/group
 * file attachment cards to offer a one-click download experience.
 */

import { Platform } from 'react-native';

/**
 * Trigger a file download on web via Blob + anchor tag.
 *
 * @param base64Data - The file content as a base64-encoded string (no data URI prefix).
 * @param filename  - The suggested filename for the download.
 * @param mimeType  - The MIME type of the file (e.g. 'application/pdf').
 */
export function triggerWebDownload(base64Data: string, filename: string, mimeType: string): void {
  if (Platform.OS !== 'web') {
    console.warn('[triggerWebDownload] Not supported on this platform');
    return;
  }

  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
