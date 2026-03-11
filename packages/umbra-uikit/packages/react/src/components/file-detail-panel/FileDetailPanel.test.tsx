/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileDetailPanel } from './FileDetailPanel';
import { WispProvider } from '../../providers';
import type { FileVersion } from '@coexist/wisp-core/types/FileDetailPanel.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
  name: 'design-spec.pdf',
  size: 1024 * 1024 * 5,
  mimeType: 'application/pdf',
  uploadedBy: 'Alice',
  uploadedAt: '2025-01-15T10:00:00Z',
};

const sampleVersions: FileVersion[] = [
  {
    version: 3,
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-15T10:00:00Z',
    size: 1024 * 1024 * 5,
    changelog: 'Final review changes',
  },
  {
    version: 2,
    uploadedBy: 'Bob',
    uploadedAt: '2025-01-10T08:00:00Z',
    size: 1024 * 1024 * 4.8,
    changelog: 'Updated diagrams',
  },
  {
    version: 1,
    uploadedBy: 'Alice',
    uploadedAt: '2025-01-05T14:00:00Z',
    size: 1024 * 1024 * 4.2,
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('FileDetailPanel -- rendering', () => {
  it('renders without crashing', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByTestId('file-detail-panel')).toBeInTheDocument();
  });

  it('renders the file name', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText('design-spec.pdf')).toBeInTheDocument();
  });

  it('renders the uploader name', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders the formatted file size', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText('5.0 MB')).toBeInTheDocument();
  });

  it('renders file type label', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText('PDF Document')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} description="A detailed design specification" />
      </Dark>,
    );
    expect(screen.getByText('A detailed design specification')).toBeInTheDocument();
  });

  it('renders download count when provided', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} downloadCount={42} />
      </Dark>,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders thumbnail when provided', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} thumbnail="https://example.com/thumb.jpg" />
      </Dark>,
    );
    const img = screen.getByAltText('design-spec.pdf');
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });
});

// ---------------------------------------------------------------------------
// Version history
// ---------------------------------------------------------------------------

describe('FileDetailPanel -- version history', () => {
  it('renders version history section', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} versions={sampleVersions} />
      </Dark>,
    );
    expect(screen.getByText('Version History')).toBeInTheDocument();
  });

  it('renders version badges', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} versions={sampleVersions} />
      </Dark>,
    );
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('renders changelogs', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} versions={sampleVersions} />
      </Dark>,
    );
    expect(screen.getByText('Final review changes')).toBeInTheDocument();
    expect(screen.getByText('Updated diagrams')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('FileDetailPanel -- skeleton', () => {
  it('renders skeleton state', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} skeleton />
      </Dark>,
    );
    expect(screen.getByTestId('file-detail-panel-skeleton')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('FileDetailPanel -- loading', () => {
  it('renders loading state', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} loading />
      </Dark>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('FileDetailPanel -- interactions', () => {
  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} onDownload={onDownload} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Download'));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} onClose={onClose} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Close detail panel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} canDelete onDelete={onDelete} />
      </Dark>,
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('does not show delete button when canDelete is false', () => {
    const onDelete = vi.fn();
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} onDelete={onDelete} />
      </Dark>,
    );
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('FileDetailPanel -- ref forwarding', () => {
  it('forwards ref to root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <FileDetailPanel ref={ref} {...defaultProps} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('FileDetailPanel -- style merge', () => {
  it('merges user style onto root element', () => {
    render(
      <Dark>
        <FileDetailPanel {...defaultProps} style={{ marginTop: 42 }} />
      </Dark>,
    );
    expect(screen.getByTestId('file-detail-panel')).toHaveStyle({ marginTop: '42px' });
  });
});
