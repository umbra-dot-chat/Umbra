import React from 'react';
import { FileUploader, VStack, Text } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

export const fileUploaderEntry: ComponentEntry = {
  slug: 'file-uploader',
  name: 'FileUploader',
  category: 'components',
  subcategory: 'Media',
  description:
    'Drag-and-drop file upload zone with file type filtering, size limits, multiple file support, and rejection callbacks.',
  variantCount: 1,
  keywords: ['file', 'upload', 'drop', 'drag', 'attachment'],

  cardPreview: (
    <div style={{ width: '100%', maxWidth: 200, pointerEvents: 'none' }}>
      <FileUploader accept="image/*" title="Drop files" description="PNG, JPG up to 5MB" />
    </div>
  ),

  examples: [
    {
      title: 'Basic',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <FileUploader
            accept="image/*"
            title="Upload Images"
            description="Drag and drop or click to browse. PNG, JPG up to 10MB."
            maxSize={10 * 1024 * 1024}
            multiple
          />
        </div>
      ),
      code: `import { FileUploader } from '@wisp-ui/react';

<FileUploader
  accept="image/*"
  title="Upload Images"
  description="PNG, JPG up to 10MB"
  maxSize={10 * 1024 * 1024}
  multiple
/>`,
      rnCode: `import { FileUploader } from '@wisp-ui/react-native';

<FileUploader
  accept="image/*"
  title="Upload Images"
  description="Tap to select. PNG, JPG up to 10MB"
  maxSize={10 * 1024 * 1024}
  multiple
  onPickFile={(files) => console.log(files)}
/>`,
    },
    {
      title: 'Single File',
      render: (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <FileUploader
            accept=".pdf"
            title="Upload PDF"
            description="Single PDF file, max 5MB."
            maxSize={5 * 1024 * 1024}
          />
        </div>
      ),
      code: `<FileUploader accept=".pdf" title="Upload PDF" maxSize={5 * 1024 * 1024} />`,
      rnCode: `import { FileUploader } from '@wisp-ui/react-native';

<FileUploader
  accept=".pdf"
  title="Upload PDF"
  maxSize={5 * 1024 * 1024}
  onPickFile={(files) => console.log(files)}
/>`,
    },
  ],

  props: [
    { name: 'accept', type: 'string', description: 'Accepted file types (e.g. "image/*").' },
    { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple files.' },
    { name: 'maxSize', type: 'number', description: 'Max file size in bytes.' },
    { name: 'maxFiles', type: 'number', description: 'Max number of files.' },
    { name: 'onChange', type: '(files: File[]) => void', description: 'File selection callback.' },
    { name: 'onReject', type: '(file: File, reason: string) => void', description: 'Rejection callback.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state.' },
    { name: 'title', type: 'string', description: 'Dropzone title.' },
    { name: 'description', type: 'string', description: 'Dropzone description.' },
  ],
};
