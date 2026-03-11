/**
 * FileCard -- Stories showing file card patterns.
 *
 * @module stories/file-card
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileCard } from './FileCard';

const meta: Meta<typeof FileCard> = {
  title: 'Components/FileCard',
  component: FileCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FileCard>;

// ---------------------------------------------------------------------------
// Default (PDF)
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (PDF)',
  args: {
    name: 'quarterly-report.pdf',
    size: 1024 * 1024 * 2.5,
    mimeType: 'application/pdf',
    downloadCount: 42,
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-15T10:00:00Z',
    version: 3,
    onDownload: () => console.log('Download clicked'),
    onClick: () => console.log('Card clicked'),
  },
};

// ---------------------------------------------------------------------------
// Image with Thumbnail
// ---------------------------------------------------------------------------

export const ImageWithThumbnail: Story = {
  name: 'Image with Thumbnail',
  args: {
    name: 'team-photo.jpg',
    size: 512 * 1024,
    mimeType: 'image/jpeg',
    thumbnail: 'https://picsum.photos/300/200',
    downloadCount: 15,
    uploadedBy: 'Bob',
    uploadedAt: '2025-01-16T12:00:00Z',
    onDownload: () => console.log('Download'),
    onClick: () => console.log('Click'),
  },
};

// ---------------------------------------------------------------------------
// Video File
// ---------------------------------------------------------------------------

export const VideoFile: Story = {
  name: 'Video File',
  args: {
    name: 'meeting-recording.mp4',
    size: 1024 * 1024 * 150,
    mimeType: 'video/mp4',
    downloadCount: 3,
    uploadedBy: 'Charlie',
    onDownload: () => console.log('Download'),
  },
};

// ---------------------------------------------------------------------------
// Audio File
// ---------------------------------------------------------------------------

export const AudioFile: Story = {
  name: 'Audio File',
  args: {
    name: 'podcast-episode-42.mp3',
    size: 1024 * 1024 * 45,
    mimeType: 'audio/mpeg',
    downloadCount: 128,
    uploadedBy: 'Diana',
    onDownload: () => console.log('Download'),
  },
};

// ---------------------------------------------------------------------------
// Generic File
// ---------------------------------------------------------------------------

export const GenericFile: Story = {
  name: 'Generic File',
  args: {
    name: 'data-export.zip',
    size: 1024 * 1024 * 30,
    mimeType: 'application/zip',
    downloadCount: 5,
    onDownload: () => console.log('Download'),
  },
};

// ---------------------------------------------------------------------------
// Selected
// ---------------------------------------------------------------------------

export const Selected: Story = {
  name: 'Selected',
  args: {
    name: 'selected-file.pdf',
    size: 1024 * 1024,
    mimeType: 'application/pdf',
    selected: true,
    downloadCount: 10,
    onDownload: () => console.log('Download'),
    onClick: () => console.log('Click'),
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
    skeleton: true,
  },
};

// ---------------------------------------------------------------------------
// Grid of Cards
// ---------------------------------------------------------------------------

export const Grid: Story = {
  name: 'Grid of Cards',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, maxWidth: 800 }}>
      <FileCard
        name="report.pdf"
        size={1024 * 1024 * 2}
        mimeType="application/pdf"
        downloadCount={42}
        version={3}
        onDownload={() => {}}
        onClick={() => {}}
      />
      <FileCard
        name="photo.jpg"
        size={512 * 1024}
        mimeType="image/jpeg"
        thumbnail="https://picsum.photos/300/200?random=1"
        downloadCount={15}
        onDownload={() => {}}
        onClick={() => {}}
      />
      <FileCard
        name="video.mp4"
        size={1024 * 1024 * 150}
        mimeType="video/mp4"
        downloadCount={3}
        onDownload={() => {}}
        onClick={() => {}}
      />
      <FileCard
        name="song.mp3"
        size={1024 * 1024 * 5}
        mimeType="audio/mpeg"
        downloadCount={88}
        onDownload={() => {}}
        onClick={() => {}}
      />
      <FileCard
        name="data.zip"
        size={1024 * 1024 * 30}
        mimeType="application/zip"
        onDownload={() => {}}
        onClick={() => {}}
      />
      <FileCard
        name="selected.docx"
        size={1024 * 256}
        mimeType="application/msword"
        selected
        downloadCount={7}
        onDownload={() => {}}
        onClick={() => {}}
      />
    </div>
  ),
};
