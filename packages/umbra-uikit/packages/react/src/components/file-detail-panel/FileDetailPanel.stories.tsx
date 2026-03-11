/**
 * FileDetailPanel -- Stories showing file detail view patterns.
 *
 * @module stories/file-detail-panel
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileDetailPanel } from './FileDetailPanel';
import type { FileVersion } from '@coexist/wisp-core/types/FileDetailPanel.types';

const meta: Meta<typeof FileDetailPanel> = {
  title: 'Components/FileDetailPanel',
  component: FileDetailPanel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FileDetailPanel>;

// ---------------------------------------------------------------------------
// Sample versions
// ---------------------------------------------------------------------------

const sampleVersions: FileVersion[] = [
  {
    version: 3,
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-15T10:00:00Z',
    size: 1024 * 1024 * 5,
    changelog: 'Final review changes applied. Updated formatting and charts.',
  },
  {
    version: 2,
    uploadedBy: 'Bob',
    uploadedAt: '2025-01-10T08:00:00Z',
    size: 1024 * 1024 * 4.8,
    changelog: 'Updated diagrams and fixed typos in section 3.',
  },
  {
    version: 1,
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-05T14:00:00Z',
    size: 1024 * 1024 * 4.2,
  },
];

// ---------------------------------------------------------------------------
// Default (PDF)
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (PDF)',
  args: {
    name: 'design-specification-v3.pdf',
    size: 1024 * 1024 * 5,
    mimeType: 'application/pdf',
    description: 'Complete design specification for the new dashboard feature including wireframes, user flows, and technical requirements.',
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-15T10:00:00Z',
    downloadCount: 42,
    versions: sampleVersions,
    onDownload: () => console.log('Download'),
    onClose: () => console.log('Close'),
    canDelete: true,
    onDelete: () => console.log('Delete'),
  },
};

// ---------------------------------------------------------------------------
// Image with Thumbnail
// ---------------------------------------------------------------------------

export const ImageWithThumbnail: Story = {
  name: 'Image with Thumbnail',
  args: {
    name: 'hero-banner.png',
    size: 1024 * 1024 * 3.2,
    mimeType: 'image/png',
    description: 'Hero banner for the landing page redesign.',
    uploadedBy: 'Bob',
    uploadedAt: '2025-01-16T12:00:00Z',
    downloadCount: 15,
    thumbnail: 'https://picsum.photos/400/200',
    onDownload: () => console.log('Download'),
    onClose: () => console.log('Close'),
  },
};

// ---------------------------------------------------------------------------
// Video File
// ---------------------------------------------------------------------------

export const VideoFile: Story = {
  name: 'Video File',
  args: {
    name: 'product-demo.mp4',
    size: 1024 * 1024 * 250,
    mimeType: 'video/mp4',
    description: 'Product demo recording for the investor presentation.',
    uploadedBy: 'Charlie',
    uploadedAt: '2025-01-17T09:00:00Z',
    downloadCount: 8,
    onDownload: () => console.log('Download'),
    onClose: () => console.log('Close'),
    canDelete: true,
    onDelete: () => console.log('Delete'),
  },
};

// ---------------------------------------------------------------------------
// With Version History
// ---------------------------------------------------------------------------

export const WithVersionHistory: Story = {
  name: 'With Version History',
  args: {
    name: 'api-documentation.md',
    size: 1024 * 128,
    mimeType: 'text/markdown',
    uploadedBy: 'Diana',
    uploadedAt: '2025-01-18T14:00:00Z',
    downloadCount: 95,
    versions: [
      {
        version: 5,
        uploadedBy: 'Diana',
        uploadedAt: '2025-01-18T14:00:00Z',
        size: 1024 * 128,
        changelog: 'Added authentication endpoints documentation',
      },
      {
        version: 4,
        uploadedBy: 'Eve',
        uploadedAt: '2025-01-15T11:00:00Z',
        size: 1024 * 120,
        changelog: 'Fixed code examples for POST /users',
      },
      {
        version: 3,
        uploadedBy: 'Diana',
        uploadedAt: '2025-01-12T09:00:00Z',
        size: 1024 * 100,
        changelog: 'Added rate limiting section',
      },
      {
        version: 2,
        uploadedBy: 'Diana',
        uploadedAt: '2025-01-08T16:00:00Z',
        size: 1024 * 80,
        changelog: 'Updated response schemas',
      },
      {
        version: 1,
        uploadedBy: 'Diana',
        uploadedAt: '2025-01-05T10:00:00Z',
        size: 1024 * 60,
      },
    ],
    onDownload: () => console.log('Download'),
    onClose: () => console.log('Close'),
  },
};

// ---------------------------------------------------------------------------
// Minimal (no extras)
// ---------------------------------------------------------------------------

export const Minimal: Story = {
  name: 'Minimal',
  args: {
    name: 'notes.txt',
    size: 1024 * 2,
    mimeType: 'text/plain',
    uploadedBy: 'Frank',
    uploadedAt: '2025-01-20T08:00:00Z',
    onClose: () => console.log('Close'),
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  args: {
    name: '',
    size: 0,
    mimeType: '',
    uploadedBy: '',
    uploadedAt: '',
    skeleton: true,
  },
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading',
  args: {
    name: '',
    size: 0,
    mimeType: '',
    uploadedBy: '',
    uploadedAt: '',
    loading: true,
  },
};
