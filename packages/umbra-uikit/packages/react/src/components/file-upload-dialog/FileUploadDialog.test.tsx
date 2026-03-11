/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUploadDialog } from './FileUploadDialog';
import { WispProvider } from '../../providers';
import type { UploadingFile } from '@coexist/wisp-core/types/FileUploadDialog.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleUploads: UploadingFile[] = [
  { id: '1', name: 'document.pdf', size: 1024 * 500, progress: 75, status: 'uploading' },
  { id: '2', name: 'photo.jpg', size: 1024 * 1024, progress: 100, status: 'complete' },
  {
    id: '3',
    name: 'video.mp4',
    size: 1024 * 1024 * 50,
    progress: 30,
    status: 'error',
    error: 'Network timeout',
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('FileUploadDialog -- rendering', () => {
  it('renders when open', () => {
    render(
      <Dark>
        <FileUploadDialog open onClose={() => {}} />
      </Dark>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <Dark>
        <FileUploadDialog open={false} onClose={() => {}} />
      </Dark>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the default title', () => {
    render(
      <Dark>
        <FileUploadDialog open onClose={() => {}} />
      </Dark>,
    );
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(
      <Dark>
        <FileUploadDialog open onClose={() => {}} title="Upload Photos" />
      </Dark>,
    );
    expect(screen.getByText('Upload Photos')).toBeInTheDocument();
  });

  it('renders target folder name', () => {
    render(
      <Dark>
        <FileUploadDialog open onClose={() => {}} targetFolderName="Documents" />
      </Dark>,
    );
    expect(screen.getByText(/Uploading to: Documents/)).toBeInTheDocument();
  });

  it('renders uploading files list', () => {
    render(
      <Dark>
        <FileUploadDialog open onClose={() => {}} uploadingFiles={sampleUploads} />
      </Dark>,
    );
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('video.mp4')).toBeInTheDocument();
  });

  it('renders upload progress status', () => {
    render(
      <Dark>
        <FileUploadDialog open onClose={() => {}} uploadingFiles={sampleUploads} />
      </Dark>,
    );
    expect(screen.getByText('1 of 3 complete')).toBeInTheDocument();
  });

  it('renders error message for failed uploads', () => {
    render(
      <Dark>
        <FileUploadDialog open onClose={() => {}} uploadingFiles={sampleUploads} />
      </Dark>,
    );
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('FileUploadDialog -- interactions', () => {
  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <FileUploadDialog open onClose={onClose} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when close footer button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <FileUploadDialog open onClose={onClose} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onCancelUpload when cancel button is clicked', () => {
    const onCancelUpload = vi.fn();
    render(
      <Dark>
        <FileUploadDialog
          open
          onClose={() => {}}
          uploadingFiles={sampleUploads}
          onCancelUpload={onCancelUpload}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancelUpload).toHaveBeenCalledWith('1');
  });

  it('calls onRetryUpload when retry button is clicked', () => {
    const onRetryUpload = vi.fn();
    render(
      <Dark>
        <FileUploadDialog
          open
          onClose={() => {}}
          uploadingFiles={sampleUploads}
          onRetryUpload={onRetryUpload}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetryUpload).toHaveBeenCalledWith('3');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('FileUploadDialog -- ref forwarding', () => {
  it('forwards ref to dialog div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <FileUploadDialog ref={ref} open onClose={() => {}} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('FileUploadDialog -- style merge', () => {
  it('merges user style onto dialog element', () => {
    render(
      <Dark>
        <FileUploadDialog open onClose={() => {}} style={{ marginTop: 42 }} />
      </Dark>,
    );
    expect(screen.getByTestId('file-upload-dialog')).toHaveStyle({ marginTop: '42px' });
  });
});
