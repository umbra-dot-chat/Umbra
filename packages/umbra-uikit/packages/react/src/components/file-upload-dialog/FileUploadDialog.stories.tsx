/**
 * FileUploadDialog -- Stories showing upload dialog patterns.
 *
 * @module stories/file-upload-dialog
 */

import React, { useState, useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileUploadDialog } from './FileUploadDialog';
import type { UploadingFile } from '@coexist/wisp-core/types/FileUploadDialog.types';

const meta: Meta<typeof FileUploadDialog> = {
  title: 'Components/FileUploadDialog',
  component: FileUploadDialog,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FileUploadDialog>;

// ---------------------------------------------------------------------------
// Default (empty)
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open Upload Dialog</button>
          <FileUploadDialog
            open={open}
            onClose={() => setOpen(false)}
            onFilesSelected={(files) => console.log('Selected:', files)}
          />
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// With target folder
// ---------------------------------------------------------------------------

export const WithTargetFolder: Story = {
  name: 'With Target Folder',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      return (
        <FileUploadDialog
          open={open}
          onClose={() => setOpen(false)}
          onFilesSelected={(files) => console.log('Selected:', files)}
          targetFolderName="Documents / Q4 Reports"
          accept=".pdf,.doc,.docx"
          maxSize={25 * 1024 * 1024}
        />
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// With Uploads In Progress
// ---------------------------------------------------------------------------

export const WithUploads: Story = {
  name: 'With Uploads In Progress',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      const uploads: UploadingFile[] = [
        { id: '1', name: 'quarterly-report-2025.pdf', size: 1024 * 1024 * 2.5, progress: 75, status: 'uploading' },
        { id: '2', name: 'team-photo.jpg', size: 512 * 1024, progress: 100, status: 'complete' },
        { id: '3', name: 'budget-v2.xlsx', size: 256 * 1024, progress: 45, status: 'uploading' },
        {
          id: '4',
          name: 'large-video-recording.mp4',
          size: 1024 * 1024 * 500,
          progress: 12,
          status: 'error',
          error: 'Network connection lost. Please check your connection and retry.',
        },
        { id: '5', name: 'notes.txt', size: 1024 * 5, progress: 0, status: 'pending' },
      ];
      return (
        <FileUploadDialog
          open={open}
          onClose={() => setOpen(false)}
          uploadingFiles={uploads}
          onCancelUpload={(id) => console.log('Cancel:', id)}
          onRetryUpload={(id) => console.log('Retry:', id)}
          targetFolderName="Project Alpha"
        />
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// All Complete
// ---------------------------------------------------------------------------

export const AllComplete: Story = {
  name: 'All Complete',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      const uploads: UploadingFile[] = [
        { id: '1', name: 'document.pdf', size: 1024 * 1024, progress: 100, status: 'complete' },
        { id: '2', name: 'image.png', size: 512 * 1024, progress: 100, status: 'complete' },
        { id: '3', name: 'data.csv', size: 256 * 1024, progress: 100, status: 'complete' },
      ];
      return (
        <FileUploadDialog
          open={open}
          onClose={() => setOpen(false)}
          uploadingFiles={uploads}
        />
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Image Only
// ---------------------------------------------------------------------------

export const ImageOnly: Story = {
  name: 'Image Upload Only',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      return (
        <FileUploadDialog
          open={open}
          onClose={() => setOpen(false)}
          accept="image/*"
          maxSize={10 * 1024 * 1024}
          title="Upload Images"
          onFilesSelected={(files) => console.log('Images:', files)}
        />
      );
    };
    return <Demo />;
  },
};
