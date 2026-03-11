/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileChannelView } from './FileChannelView';
import { WispProvider } from '../../providers';
import type { FileFolder, FileEntry } from '@coexist/wisp-core/types/FileChannelView.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleFolders: FileFolder[] = [
  { id: 'f1', name: 'Documents', fileCount: 5 },
  { id: 'f2', name: 'Images', fileCount: 12 },
  {
    id: 'f3',
    name: 'Projects',
    children: [{ id: 'f3a', name: 'Project Alpha', parentId: 'f3' }],
  },
];

const sampleFiles: FileEntry[] = [
  {
    id: '1',
    name: 'report.pdf',
    size: 1024 * 1024 * 2,
    mimeType: 'application/pdf',
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-15T10:00:00Z',
    downloadCount: 10,
  },
  {
    id: '2',
    name: 'photo.jpg',
    size: 512 * 1024,
    mimeType: 'image/jpeg',
    uploadedBy: 'Bob',
    uploadedAt: '2025-01-16T12:00:00Z',
    thumbnail: 'https://example.com/photo.jpg',
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('FileChannelView -- rendering', () => {
  it('renders without crashing', () => {
    render(
      <Dark>
        <FileChannelView folders={sampleFolders} files={sampleFiles} />
      </Dark>,
    );
    expect(screen.getByTestId('file-channel-view')).toBeInTheDocument();
  });

  it('renders folder names in the sidebar', () => {
    render(
      <Dark>
        <FileChannelView folders={sampleFolders} files={sampleFiles} />
      </Dark>,
    );
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders file names', () => {
    render(
      <Dark>
        <FileChannelView folders={sampleFolders} files={sampleFiles} />
      </Dark>,
    );
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });

  it('renders empty state when no files', () => {
    render(
      <Dark>
        <FileChannelView folders={sampleFolders} files={[]} emptyText="Nothing here" />
      </Dark>,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders default empty text', () => {
    render(
      <Dark>
        <FileChannelView folders={sampleFolders} files={[]} />
      </Dark>,
    );
    expect(screen.getByText('No files yet')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('FileChannelView -- skeleton', () => {
  it('renders skeleton state', () => {
    const { container } = render(
      <Dark>
        <FileChannelView folders={[]} files={[]} skeleton />
      </Dark>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('FileChannelView -- interactions', () => {
  it('calls onFolderClick when a folder is clicked', () => {
    const onFolderClick = vi.fn();
    render(
      <Dark>
        <FileChannelView
          folders={sampleFolders}
          files={sampleFiles}
          onFolderClick={onFolderClick}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Documents'));
    expect(onFolderClick).toHaveBeenCalledWith('f1');
  });

  it('calls onFileClick when a file is clicked', () => {
    const onFileClick = vi.fn();
    render(
      <Dark>
        <FileChannelView
          folders={sampleFolders}
          files={sampleFiles}
          onFileClick={onFileClick}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('report.pdf'));
    expect(onFileClick).toHaveBeenCalledWith('1');
  });

  it('calls onUploadClick when upload button is clicked', () => {
    const onUploadClick = vi.fn();
    render(
      <Dark>
        <FileChannelView
          folders={sampleFolders}
          files={sampleFiles}
          onUploadClick={onUploadClick}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Upload'));
    expect(onUploadClick).toHaveBeenCalledOnce();
  });

  it('calls onCreateFolder when new folder button is clicked', () => {
    const onCreateFolder = vi.fn();
    render(
      <Dark>
        <FileChannelView
          folders={sampleFolders}
          files={sampleFiles}
          onCreateFolder={onCreateFolder}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('New Folder'));
    expect(onCreateFolder).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// View mode
// ---------------------------------------------------------------------------

describe('FileChannelView -- view mode', () => {
  it('renders grid view by default', () => {
    render(
      <Dark>
        <FileChannelView folders={sampleFolders} files={sampleFiles} />
      </Dark>,
    );
    // Grid toggle should be pressed
    const gridBtn = screen.getByLabelText('Grid view');
    expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onViewModeChange when list view is selected', () => {
    const onViewModeChange = vi.fn();
    render(
      <Dark>
        <FileChannelView
          folders={sampleFolders}
          files={sampleFiles}
          onViewModeChange={onViewModeChange}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('List view'));
    expect(onViewModeChange).toHaveBeenCalledWith('list');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('FileChannelView -- ref forwarding', () => {
  it('forwards ref to root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <FileChannelView ref={ref} folders={sampleFolders} files={sampleFiles} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('FileChannelView -- style merge', () => {
  it('merges user style onto root element', () => {
    render(
      <Dark>
        <FileChannelView
          folders={sampleFolders}
          files={sampleFiles}
          style={{ marginTop: 42 }}
        />
      </Dark>,
    );
    expect(screen.getByTestId('file-channel-view')).toHaveStyle({ marginTop: '42px' });
  });
});
