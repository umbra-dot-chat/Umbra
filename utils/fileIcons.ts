/**
 * File type icon mapping utility.
 *
 * Maps MIME types to display icons (emoji for now) and accent colors.
 * Used in file cards, message bubbles, and file panels.
 *
 * @packageDocumentation
 */

export interface FileTypeIcon {
  /** Emoji icon for the file type */
  icon: string;
  /** Display label for the file type */
  label: string;
  /** Accent color hex for the file type */
  color: string;
}

const TYPE_MAP: Array<{ prefixes: string[]; icon: FileTypeIcon }> = [
  // Images
  {
    prefixes: ['image/'],
    icon: { icon: '\uD83D\uDDBC\uFE0F', label: 'Image', color: '#10B981' },
  },
  // PDF
  {
    prefixes: ['application/pdf'],
    icon: { icon: '\uD83D\uDCC4', label: 'PDF', color: '#EF4444' },
  },
  // Documents (Word, OpenDoc, etc.)
  {
    prefixes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml',
      'application/vnd.oasis.opendocument.text',
    ],
    icon: { icon: '\uD83D\uDCC3', label: 'Document', color: '#3B82F6' },
  },
  // Spreadsheets
  {
    prefixes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/csv',
    ],
    icon: { icon: '\uD83D\uDCCA', label: 'Spreadsheet', color: '#22C55E' },
  },
  // Presentations
  {
    prefixes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml',
    ],
    icon: { icon: '\uD83D\uDCCA', label: 'Presentation', color: '#F97316' },
  },
  // Code / text
  {
    prefixes: [
      'text/plain',
      'text/markdown',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/typescript',
      'application/json',
      'application/xml',
      'application/yaml',
      'text/x-',
      'application/x-python',
      'application/x-ruby',
      'application/x-rust',
    ],
    icon: { icon: '\uD83D\uDCDD', label: 'Text', color: '#8B5CF6' },
  },
  // Archives
  {
    prefixes: [
      'application/zip',
      'application/x-rar',
      'application/x-7z',
      'application/gzip',
      'application/x-tar',
      'application/x-bzip2',
    ],
    icon: { icon: '\uD83D\uDCE6', label: 'Archive', color: '#F59E0B' },
  },
  // Audio
  {
    prefixes: ['audio/'],
    icon: { icon: '\uD83C\uDFB5', label: 'Audio', color: '#EC4899' },
  },
  // Video
  {
    prefixes: ['video/'],
    icon: { icon: '\uD83C\uDFA5', label: 'Video', color: '#6366F1' },
  },
  // SVG (specific image type with different icon)
  {
    prefixes: ['image/svg+xml'],
    icon: { icon: '\uD83C\uDFA8', label: 'SVG', color: '#F59E0B' },
  },
];

const DEFAULT_ICON: FileTypeIcon = {
  icon: '\uD83D\uDCC4',
  label: 'File',
  color: '#6B7280',
};

/**
 * Get the display icon and color for a given MIME type.
 */
export function getFileTypeIcon(mimeType: string): FileTypeIcon {
  const mime = mimeType.toLowerCase();
  for (const entry of TYPE_MAP) {
    for (const prefix of entry.prefixes) {
      if (mime.startsWith(prefix)) {
        return entry.icon;
      }
    }
  }
  return DEFAULT_ICON;
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
