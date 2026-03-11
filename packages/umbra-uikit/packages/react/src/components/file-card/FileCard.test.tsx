/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileCard } from './FileCard';
import { WispProvider } from '../../providers';

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
  name: 'report.pdf',
  size: 1024 * 1024 * 2.5,
  mimeType: 'application/pdf',
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('FileCard -- rendering', () => {
  it('renders without crashing', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByTestId('file-card')).toBeInTheDocument();
  });

  it('renders the file name', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('renders the formatted file size', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} />
      </Dark>,
    );
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
  });

  it('renders download count when provided', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} downloadCount={42} />
      </Dark>,
    );
    expect(screen.getByText('42 downloads')).toBeInTheDocument();
  });

  it('renders singular download text', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} downloadCount={1} />
      </Dark>,
    );
    expect(screen.getByText('1 download')).toBeInTheDocument();
  });

  it('renders version when provided', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} version={3} />
      </Dark>,
    );
    expect(screen.getByText('v3')).toBeInTheDocument();
  });

  it('renders thumbnail when provided', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} thumbnail="https://example.com/thumb.jpg" />
      </Dark>,
    );
    const img = screen.getByAltText('report.pdf');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('FileCard -- skeleton', () => {
  it('renders skeleton state', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} skeleton />
      </Dark>,
    );
    expect(screen.getByTestId('file-card-skeleton')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('FileCard -- interactions', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <Dark>
        <FileCard {...defaultProps} onClick={onClick} />
      </Dark>,
    );
    fireEvent.click(screen.getByTestId('file-card'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    const onClick = vi.fn();
    render(
      <Dark>
        <FileCard {...defaultProps} onClick={onClick} onDownload={onDownload} />
      </Dark>,
    );
    // Simulate hover to make download button visible
    const card = screen.getByTestId('file-card');
    fireEvent.mouseEnter(card);
    const dlBtn = screen.getByLabelText('Download file');
    fireEvent.click(dlBtn);
    expect(onDownload).toHaveBeenCalledOnce();
    // onClick should not have been called (stopPropagation)
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Selected state
// ---------------------------------------------------------------------------

describe('FileCard -- selected state', () => {
  it('sets aria-selected when selected', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} selected />
      </Dark>,
    );
    expect(screen.getByTestId('file-card')).toHaveAttribute('aria-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('FileCard -- ref forwarding', () => {
  it('forwards ref to root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <FileCard ref={ref} {...defaultProps} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('FileCard -- style merge', () => {
  it('merges user style onto root element', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} style={{ marginTop: 42 }} />
      </Dark>,
    );
    expect(screen.getByTestId('file-card')).toHaveStyle({ marginTop: '42px' });
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('FileCard -- className passthrough', () => {
  it('passes className to root element', () => {
    render(
      <Dark>
        <FileCard {...defaultProps} className="my-card" />
      </Dark>,
    );
    expect(screen.getByTestId('file-card')).toHaveClass('my-card');
  });
});
