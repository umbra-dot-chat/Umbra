/**
 * FileUploader — Stories showing dropzone patterns.
 *
 * @module stories/file-uploader
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileUploader } from '@wisp-ui/react';
import { Image, FileText } from 'lucide-react';

const meta: Meta<typeof FileUploader> = {
  title: 'React/Components/Data Entry/FileUploader',
  component: FileUploader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FileUploader>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024,
  },
};

// ---------------------------------------------------------------------------
// Image Upload
// ---------------------------------------------------------------------------

export const ImageUpload: Story = {
  name: 'Image Upload',
  args: {
    accept: 'image/png, image/jpeg, image/gif',
    maxSize: 10 * 1024 * 1024,
    icon: Image,
    title: 'Upload an image',
    description: 'PNG, JPG, or GIF up to 10MB',
  },
};

// ---------------------------------------------------------------------------
// Document Upload
// ---------------------------------------------------------------------------

export const DocumentUpload: Story = {
  name: 'Document Upload',
  args: {
    accept: '.pdf,.doc,.docx',
    maxSize: 25 * 1024 * 1024,
    icon: FileText,
    title: 'Upload a document',
    description: 'PDF, DOC, or DOCX up to 25MB',
    multiple: true,
  },
};

// ---------------------------------------------------------------------------
// With File List
// ---------------------------------------------------------------------------

export const WithFileList: Story = {
  name: 'With File List',
  render: () => {
    const Demo = () => {
      const [files, setFiles] = useState<File[]>([]);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          <FileUploader
            accept="image/*"
            multiple
            maxSize={5 * 1024 * 1024}
            onChange={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
          />
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {files.map((f, i) => (
                <div key={i} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{f.name}</span>
                  <span style={{ opacity: 0.5 }}>{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  args: {
    disabled: true,
  },
};
