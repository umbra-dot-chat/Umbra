/**
 * File type icon mapping utility.
 *
 * Maps MIME types to Lucide icon components and accent colors.
 * Used in file cards, message bubbles, and file panels.
 *
 * @packageDocumentation
 */

import React from 'react';
import {
  ImageIcon,
  FilePdfIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  PresentationIcon,
  FileCodeIcon,
  PackageIcon,
  MusicIcon,
  FilmIcon,
  FileIcon,
} from '@/components/icons';

export interface FileTypeIcon {
  /** React component for the file type icon */
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  /** Display label for the file type */
  label: string;
  /** Accent color hex for the file type */
  color: string;
  /** @deprecated Emoji icon — use IconComponent instead */
  icon: string;
}

const TYPE_MAP: Array<{ prefixes: string[]; icon: FileTypeIcon }> = [
  // SVG (must be before generic image/)
  {
    prefixes: ['image/svg+xml'],
    icon: { IconComponent: ImageIcon, label: 'SVG', color: '#F59E0B', icon: '' },
  },
  // Images
  {
    prefixes: ['image/'],
    icon: { IconComponent: ImageIcon, label: 'Image', color: '#10B981', icon: '' },
  },
  // PDF
  {
    prefixes: ['application/pdf'],
    icon: { IconComponent: FilePdfIcon, label: 'PDF', color: '#EF4444', icon: '' },
  },
  // Documents (Word, OpenDoc, etc.)
  {
    prefixes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml',
      'application/vnd.oasis.opendocument.text',
    ],
    icon: { IconComponent: FileTextIcon, label: 'Document', color: '#3B82F6', icon: '' },
  },
  // Spreadsheets
  {
    prefixes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/csv',
    ],
    icon: { IconComponent: FileSpreadsheetIcon, label: 'Spreadsheet', color: '#22C55E', icon: '' },
  },
  // Presentations
  {
    prefixes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml',
    ],
    icon: { IconComponent: PresentationIcon, label: 'Presentation', color: '#F97316', icon: '' },
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
    icon: { IconComponent: FileCodeIcon, label: 'Text', color: '#8B5CF6', icon: '' },
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
    icon: { IconComponent: PackageIcon, label: 'Archive', color: '#F59E0B', icon: '' },
  },
  // Audio
  {
    prefixes: ['audio/'],
    icon: { IconComponent: MusicIcon, label: 'Audio', color: '#EC4899', icon: '' },
  },
  // Video
  {
    prefixes: ['video/'],
    icon: { IconComponent: FilmIcon, label: 'Video', color: '#6366F1', icon: '' },
  },
];

const DEFAULT_ICON: FileTypeIcon = {
  IconComponent: FileIcon,
  label: 'File',
  color: '#6B7280',
  icon: '',
};

/**
 * Get the display icon component and color for a given MIME type.
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
