import React from 'react';
import { AttachmentPreview } from '@wisp-ui/react';
import type { Attachment } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

const imageAttachments: Attachment[] = [
  {
    id: '1',
    fileName: 'screenshot.png',
    fileSize: 245760,
    fileType: 'image',
    thumbnailUrl: 'https://placehold.co/120x80/333/999?text=Screenshot',
  },
  {
    id: '2',
    fileName: 'photo.jpg',
    fileSize: 1048576,
    fileType: 'image',
    thumbnailUrl: 'https://placehold.co/120x80/333/999?text=Photo',
  },
];

const mixedAttachments: Attachment[] = [
  {
    id: '1',
    fileName: 'design-mockup.png',
    fileSize: 524288,
    fileType: 'image',
    thumbnailUrl: 'https://placehold.co/120x80/333/999?text=Mockup',
  },
  {
    id: '2',
    fileName: 'report.pdf',
    fileSize: 2097152,
    fileType: 'document',
  },
  {
    id: '3',
    fileName: 'intro-video.mp4',
    fileSize: 15728640,
    fileType: 'video',
  },
  {
    id: '4',
    fileName: 'podcast.mp3',
    fileSize: 4194304,
    fileType: 'audio',
  },
  {
    id: '5',
    fileName: 'project-files.zip',
    fileSize: 8388608,
    fileType: 'archive',
  },
];

const progressAttachments: Attachment[] = [
  {
    id: '1',
    fileName: 'uploading-image.png',
    fileSize: 1048576,
    fileType: 'image',
    progress: 65,
  },
  {
    id: '2',
    fileName: 'large-video.mp4',
    fileSize: 52428800,
    fileType: 'video',
    progress: 30,
  },
  {
    id: '3',
    fileName: 'completed.pdf',
    fileSize: 2097152,
    fileType: 'document',
    progress: 100,
  },
];

const errorAttachments: Attachment[] = [
  {
    id: '1',
    fileName: 'failed-upload.png',
    fileSize: 1048576,
    fileType: 'image',
    error: true,
  },
  {
    id: '2',
    fileName: 'success.pdf',
    fileSize: 524288,
    fileType: 'document',
  },
  {
    id: '3',
    fileName: 'also-failed.mp4',
    fileSize: 10485760,
    fileType: 'video',
    error: true,
  },
];

export const attachmentPreviewEntry: ComponentEntry = {
  slug: 'attachment-preview',
  name: 'AttachmentPreview',
  category: 'components',
  subcategory: 'Chat & Messaging',
  description:
    'Horizontal scrollable row of queued file preview cards with thumbnails, progress bars, and remove buttons.',
  variantCount: 5,
  keywords: ['attachment', 'preview', 'file', 'upload', 'image', 'document', 'queue'],

  cardPreview: (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <AttachmentPreview
        attachments={[
          { id: '1', fileName: 'photo.jpg', fileSize: 245760, fileType: 'image', thumbnailUrl: 'https://placehold.co/120x80/333/999?text=IMG' },
          { id: '2', fileName: 'report.pdf', fileSize: 1048576, fileType: 'document' },
        ]}
      />
    </div>
  ),

  examples: [
    {
      title: 'Image Attachments',
      render: (
        <AttachmentPreview
          attachments={imageAttachments}
          onRemove={() => {}}
          onPreview={() => {}}
        />
      ),
      code: `<AttachmentPreview
  attachments={[
    {
      id: '1',
      fileName: 'screenshot.png',
      fileSize: 245760,
      fileType: 'image',
      thumbnailUrl: '/path/to/thumb.png',
    },
    {
      id: '2',
      fileName: 'photo.jpg',
      fileSize: 1048576,
      fileType: 'image',
      thumbnailUrl: '/path/to/thumb.jpg',
    },
  ]}
  onRemove={(id) => removeAttachment(id)}
  onPreview={(attachment) => openPreview(attachment)}
/>`,
    },
    {
      title: 'Mixed Files',
      render: (
        <AttachmentPreview
          attachments={mixedAttachments}
          onRemove={() => {}}
          onPreview={() => {}}
        />
      ),
      code: `<AttachmentPreview
  attachments={[
    { id: '1', fileName: 'mockup.png', fileSize: 524288, fileType: 'image', thumbnailUrl: '...' },
    { id: '2', fileName: 'report.pdf', fileSize: 2097152, fileType: 'document' },
    { id: '3', fileName: 'video.mp4', fileSize: 15728640, fileType: 'video' },
    { id: '4', fileName: 'podcast.mp3', fileSize: 4194304, fileType: 'audio' },
    { id: '5', fileName: 'files.zip', fileSize: 8388608, fileType: 'archive' },
  ]}
  onRemove={(id) => removeAttachment(id)}
/>`,
    },
    {
      title: 'With Progress',
      render: (
        <AttachmentPreview
          attachments={progressAttachments}
          onRemove={() => {}}
        />
      ),
      code: `<AttachmentPreview
  attachments={[
    { id: '1', fileName: 'image.png', fileSize: 1048576, fileType: 'image', progress: 65 },
    { id: '2', fileName: 'video.mp4', fileSize: 52428800, fileType: 'video', progress: 30 },
    { id: '3', fileName: 'done.pdf', fileSize: 2097152, fileType: 'document', progress: 100 },
  ]}
  onRemove={(id) => removeAttachment(id)}
/>`,
    },
    {
      title: 'With Error',
      render: (
        <AttachmentPreview
          attachments={errorAttachments}
          onRemove={() => {}}
        />
      ),
      code: `<AttachmentPreview
  attachments={[
    { id: '1', fileName: 'failed.png', fileSize: 1048576, fileType: 'image', error: true },
    { id: '2', fileName: 'success.pdf', fileSize: 524288, fileType: 'document' },
    { id: '3', fileName: 'also-failed.mp4', fileSize: 10485760, fileType: 'video', error: true },
  ]}
  onRemove={(id) => removeAttachment(id)}
/>`,
    },
    {
      title: 'Disabled',
      render: (
        <AttachmentPreview
          attachments={mixedAttachments.slice(0, 3)}
          onRemove={() => {}}
          disabled
        />
      ),
      code: `<AttachmentPreview
  attachments={attachments}
  onRemove={(id) => removeAttachment(id)}
  disabled
/>`,
    },
  ],

  props: [
    { name: 'attachments', type: 'Attachment[]', required: true, description: 'List of queued attachments.' },
    { name: 'onRemove', type: '(id: string) => void', description: 'Called when the remove button is clicked on an attachment.' },
    { name: 'onPreview', type: '(attachment: Attachment) => void', description: 'Called when an attachment card is clicked (e.g. to preview).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether all attachments are disabled (e.g. while sending).' },
  ],
};
