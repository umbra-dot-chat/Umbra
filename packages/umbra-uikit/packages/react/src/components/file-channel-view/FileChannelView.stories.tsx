/**
 * FileChannelView -- Stories showing file channel layouts.
 *
 * @module stories/file-channel-view
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileChannelView } from './FileChannelView';
import type {
  FileFolder,
  FileEntry,
  FileViewMode,
} from '@coexist/wisp-core/types/FileChannelView.types';

const meta: Meta<typeof FileChannelView> = {
  title: 'Components/FileChannelView',
  component: FileChannelView,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FileChannelView>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const folders: FileFolder[] = [
  { id: 'f1', name: 'Documents', fileCount: 5 },
  { id: 'f2', name: 'Images', fileCount: 12 },
  {
    id: 'f3',
    name: 'Projects',
    fileCount: 3,
    children: [
      { id: 'f3a', name: 'Project Alpha', parentId: 'f3', fileCount: 2 },
      { id: 'f3b', name: 'Project Beta', parentId: 'f3', fileCount: 1 },
    ],
  },
  { id: 'f4', name: 'Archives', fileCount: 0 },
];

const files: FileEntry[] = [
  {
    id: '1',
    name: 'quarterly-report.pdf',
    size: 1024 * 1024 * 2.5,
    mimeType: 'application/pdf',
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-15T10:00:00Z',
    downloadCount: 42,
    version: 3,
  },
  {
    id: '2',
    name: 'team-photo.jpg',
    size: 512 * 1024,
    mimeType: 'image/jpeg',
    uploadedBy: 'Bob',
    uploadedAt: '2025-01-16T12:00:00Z',
    downloadCount: 15,
  },
  {
    id: '3',
    name: 'presentation.pptx',
    size: 1024 * 1024 * 8,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    uploadedBy: 'Charlie',
    uploadedAt: '2025-01-17T09:00:00Z',
    downloadCount: 7,
  },
  {
    id: '4',
    name: 'meeting-recording.mp4',
    size: 1024 * 1024 * 150,
    mimeType: 'video/mp4',
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-18T14:00:00Z',
    downloadCount: 3,
  },
  {
    id: '5',
    name: 'budget-spreadsheet.xlsx',
    size: 1024 * 256,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedBy: 'Diana',
    uploadedAt: '2025-01-19T11:00:00Z',
    downloadCount: 20,
  },
  {
    id: '6',
    name: 'podcast-episode.mp3',
    size: 1024 * 1024 * 45,
    mimeType: 'audio/mpeg',
    uploadedBy: 'Eve',
    uploadedAt: '2025-01-20T16:00:00Z',
    downloadCount: 8,
  },
];

// ---------------------------------------------------------------------------
// Default (Grid View)
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (Grid View)',
  render: () => {
    const Demo = () => {
      const [viewMode, setViewMode] = useState<FileViewMode>('grid');
      const [currentFolder, setCurrentFolder] = useState<string | null>(null);
      return (
        <div style={{ height: 500, border: '1px solid #333', borderRadius: 8 }}>
          <FileChannelView
            folders={folders}
            files={files}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            currentFolderId={currentFolder}
            onFolderClick={setCurrentFolder}
            onFileClick={(id) => console.log('File clicked:', id)}
            onUploadClick={() => console.log('Upload clicked')}
            onCreateFolder={() => console.log('Create folder clicked')}
            breadcrumbPath={
              currentFolder
                ? [{ id: currentFolder, name: folders.find((f) => f.id === currentFolder)?.name || '' }]
                : []
            }
            onBreadcrumbClick={(id) => setCurrentFolder(id)}
          />
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// List View
// ---------------------------------------------------------------------------

export const ListView: Story = {
  name: 'List View',
  render: () => (
    <div style={{ height: 500, border: '1px solid #333', borderRadius: 8 }}>
      <FileChannelView
        folders={folders}
        files={files}
        viewMode="list"
        onFileClick={(id) => console.log('File clicked:', id)}
        onUploadClick={() => console.log('Upload clicked')}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty State',
  render: () => (
    <div style={{ height: 400, border: '1px solid #333', borderRadius: 8 }}>
      <FileChannelView
        folders={folders}
        files={[]}
        emptyText="Drop files here or click Upload to get started"
        onUploadClick={() => console.log('Upload clicked')}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// With Breadcrumb
// ---------------------------------------------------------------------------

export const WithBreadcrumb: Story = {
  name: 'With Breadcrumb',
  render: () => (
    <div style={{ height: 500, border: '1px solid #333', borderRadius: 8 }}>
      <FileChannelView
        folders={folders}
        files={files.slice(0, 3)}
        currentFolderId="f3a"
        breadcrumbPath={[
          { id: 'f3', name: 'Projects' },
          { id: 'f3a', name: 'Project Alpha' },
        ]}
        onBreadcrumbClick={(id) => console.log('Breadcrumb:', id)}
        onFileClick={(id) => console.log('File:', id)}
        onUploadClick={() => console.log('Upload')}
        onCreateFolder={() => console.log('New folder')}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export const Skeleton: Story = {
  name: 'Skeleton',
  render: () => (
    <div style={{ height: 500, border: '1px solid #333', borderRadius: 8 }}>
      <FileChannelView folders={[]} files={[]} skeleton />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading',
  render: () => (
    <div style={{ height: 400, border: '1px solid #333', borderRadius: 8 }}>
      <FileChannelView folders={folders} files={[]} loading />
    </div>
  ),
};
