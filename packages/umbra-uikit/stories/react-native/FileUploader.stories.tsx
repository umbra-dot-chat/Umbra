import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileUploader } from '@wisp-ui/react-native';

const meta: Meta<typeof FileUploader> = {
  title: 'React Native/Components/Data Entry/FileUploader',
  component: FileUploader,
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FileUploader>;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    onPickFile: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
};

// ---------------------------------------------------------------------------
// 2. With Accepted Types
// ---------------------------------------------------------------------------

export const WithAcceptedTypes: Story = {
  name: 'With Accepted Types',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Images Only</div>
      <FileUploader
        accept=".png, .jpg, .jpeg, .gif"
        title="Upload an image"
        maxSize={5 * 1024 * 1024}
        onPickFile={() => {}}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Documents</div>
      <FileUploader
        accept=".pdf, .doc, .docx"
        title="Upload a document"
        maxSize={10 * 1024 * 1024}
        onPickFile={() => {}}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Custom Description</div>
      <FileUploader
        title="Drop your files here"
        description="SVG, PNG, JPG or GIF (max. 2MB)"
        onPickFile={() => {}}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Multiple
// ---------------------------------------------------------------------------

export const Multiple: Story = {
  name: 'Multiple',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Single File</div>
      <FileUploader
        title="Tap to select a file"
        onPickFile={() => {}}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Multiple Files</div>
      <FileUploader
        multiple
        maxFiles={5}
        title="Tap to select files"
        description="Up to 5 files"
        onPickFile={() => {}}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Multiple with Size Limit</div>
      <FileUploader
        multiple
        maxFiles={10}
        maxSize={25 * 1024 * 1024}
        accept=".png, .jpg"
        title="Upload images"
        onPickFile={() => {}}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Disabled
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled State</div>
      <FileUploader
        disabled
        title="Upload disabled"
        description="File upload is currently unavailable"
        onPickFile={() => {}}
      />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 5. Custom Titles
// ---------------------------------------------------------------------------

export const CustomTitles: Story = {
  name: 'Custom Titles',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 400 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Avatar Upload</div>
      <FileUploader
        accept=".png, .jpg"
        maxSize={2 * 1024 * 1024}
        title="Choose a profile photo"
        description="PNG or JPG up to 2MB"
        onPickFile={() => {}}
      />

      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Resume Upload</div>
      <FileUploader
        accept=".pdf"
        maxSize={5 * 1024 * 1024}
        title="Upload your resume"
        description="PDF format only, up to 5MB"
        onPickFile={() => {}}
      />
    </div>
  ),
};
