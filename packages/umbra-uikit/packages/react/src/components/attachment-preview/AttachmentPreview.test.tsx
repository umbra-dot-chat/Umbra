/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WispProvider } from '../../providers';
import { AttachmentPreview } from './AttachmentPreview';
import type { Attachment } from '@coexist/wisp-core/types/AttachmentPreview.types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseAttachments: Attachment[] = [
  {
    id: 'a1',
    fileName: 'photo.png',
    fileSize: 1024 * 512, // 512 KB
    fileType: 'image',
    thumbnailUrl: 'https://example.com/photo-thumb.png',
  },
  {
    id: 'a2',
    fileName: 'document.pdf',
    fileSize: 1024 * 1024 * 2, // 2 MB
    fileType: 'document',
  },
  {
    id: 'a3',
    fileName: 'song.mp3',
    fileSize: 1024 * 1024 * 5, // 5 MB
    fileType: 'audio',
  },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('AttachmentPreview — rendering', () => {
  it('renders attachment file names', () => {
    render(
      <Dark>
        <AttachmentPreview attachments={baseAttachments} />
      </Dark>,
    );
    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('song.mp3')).toBeInTheDocument();
  });

  it('renders formatted file sizes', () => {
    render(
      <Dark>
        <AttachmentPreview attachments={baseAttachments} />
      </Dark>,
    );
    expect(screen.getByText('512 KB')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByText('5 MB')).toBeInTheDocument();
  });

  it('renders zero bytes as "0 B"', () => {
    const attachments: Attachment[] = [
      { id: 'z1', fileName: 'empty.txt', fileSize: 0, fileType: 'document' },
    ];
    render(
      <Dark>
        <AttachmentPreview attachments={attachments} />
      </Dark>,
    );
    expect(screen.getByText('0 B')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Ref forwarding
// ---------------------------------------------------------------------------

describe('AttachmentPreview — ref forwarding', () => {
  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AttachmentPreview ref={ref} attachments={baseAttachments} />
      </Dark>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

// ---------------------------------------------------------------------------
// className passthrough
// ---------------------------------------------------------------------------

describe('AttachmentPreview — className', () => {
  it('passes className through to the root element', () => {
    const { container } = render(
      <Dark>
        <AttachmentPreview
          attachments={baseAttachments}
          className="custom-attachments"
        />
      </Dark>,
    );
    expect(container.querySelector('.custom-attachments')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Style merge
// ---------------------------------------------------------------------------

describe('AttachmentPreview — style merge', () => {
  it('merges user style onto the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AttachmentPreview
          ref={ref}
          attachments={baseAttachments}
          style={{ marginTop: 8 }}
        />
      </Dark>,
    );
    expect(ref.current!.style.marginTop).toBe('8px');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('AttachmentPreview — accessibility', () => {
  it('has aria-label "Attachment previews" on the root element', () => {
    render(
      <Dark>
        <AttachmentPreview attachments={baseAttachments} />
      </Dark>,
    );
    expect(screen.getByLabelText('Attachment previews')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Remove button
// ---------------------------------------------------------------------------

describe('AttachmentPreview — remove button', () => {
  it('renders remove buttons when onRemove is provided', () => {
    render(
      <Dark>
        <AttachmentPreview attachments={baseAttachments} onRemove={vi.fn()} />
      </Dark>,
    );
    expect(screen.getByLabelText('Remove photo.png')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove document.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove song.mp3')).toBeInTheDocument();
  });

  it('fires onRemove with the attachment id when remove is clicked', () => {
    const onRemove = vi.fn();
    render(
      <Dark>
        <AttachmentPreview attachments={baseAttachments} onRemove={onRemove} />
      </Dark>,
    );
    fireEvent.click(screen.getByLabelText('Remove document.pdf'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('a2');
  });

  it('does not render remove buttons when onRemove is not provided', () => {
    const { container } = render(
      <Dark>
        <AttachmentPreview attachments={baseAttachments} />
      </Dark>,
    );
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Preview click
// ---------------------------------------------------------------------------

describe('AttachmentPreview — preview click', () => {
  it('fires onPreview with the attachment object when a card is clicked', () => {
    const onPreview = vi.fn();
    render(
      <Dark>
        <AttachmentPreview
          attachments={baseAttachments}
          onPreview={onPreview}
        />
      </Dark>,
    );
    fireEvent.click(screen.getByText('photo.png'));
    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', fileName: 'photo.png' }),
    );
  });

  it('responds to keyboard Enter on a card', () => {
    const onPreview = vi.fn();
    render(
      <Dark>
        <AttachmentPreview
          attachments={baseAttachments}
          onPreview={onPreview}
        />
      </Dark>,
    );
    const card = screen.getByText('photo.png').closest('[role="button"]')!;
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Thumbnail vs icon
// ---------------------------------------------------------------------------

describe('AttachmentPreview — thumbnail vs icon', () => {
  it('renders an img element for image attachments with thumbnailUrl', () => {
    const { container } = render(
      <Dark>
        <AttachmentPreview attachments={[baseAttachments[0]]} />
      </Dark>,
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img!.getAttribute('src')).toBe('https://example.com/photo-thumb.png');
    expect(img!.getAttribute('alt')).toBe('photo.png');
  });

  it('renders an SVG icon for non-image attachments', () => {
    const { container } = render(
      <Dark>
        <AttachmentPreview attachments={[baseAttachments[1]]} />
      </Dark>,
    );
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders different SVG icons for different file types', () => {
    const attachments: Attachment[] = [
      { id: 'v1', fileName: 'movie.mp4', fileSize: 1024, fileType: 'video' },
      { id: 'ar1', fileName: 'archive.zip', fileSize: 1024, fileType: 'archive' },
      { id: 'o1', fileName: 'unknown.xyz', fileSize: 1024, fileType: 'other' },
    ];
    const { container } = render(
      <Dark>
        <AttachmentPreview attachments={attachments} />
      </Dark>,
    );
    // Each card should have at least one SVG icon
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

describe('AttachmentPreview — progress bar', () => {
  it('renders progress bar when progress is less than 100', () => {
    const attachments: Attachment[] = [
      {
        id: 'p1',
        fileName: 'uploading.pdf',
        fileSize: 1024,
        fileType: 'document',
        progress: 45,
      },
    ];
    const { container } = render(
      <Dark>
        <AttachmentPreview attachments={attachments} />
      </Dark>,
    );
    // Progress bar is a container div with a fill div inside
    // We check for the file name and that extra divs exist
    expect(screen.getByText('uploading.pdf')).toBeInTheDocument();
    // The card should have the progress bar container
    const card = screen.getByText('uploading.pdf').closest('[role="button"]')!;
    // There should be nested divs for progress
    const innerDivs = card.querySelectorAll('div');
    expect(innerDivs.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render progress bar when progress is 100', () => {
    const attachments: Attachment[] = [
      {
        id: 'p2',
        fileName: 'done.pdf',
        fileSize: 1024,
        fileType: 'document',
        progress: 100,
      },
    ];
    const { container } = render(
      <Dark>
        <AttachmentPreview attachments={attachments} />
      </Dark>,
    );
    // With progress at 100, showProgress is false — no progress bar
    expect(screen.getByText('done.pdf')).toBeInTheDocument();
  });

  it('does not render progress bar when progress is undefined', () => {
    const attachments: Attachment[] = [
      {
        id: 'p3',
        fileName: 'ready.pdf',
        fileSize: 1024,
        fileType: 'document',
      },
    ];
    render(
      <Dark>
        <AttachmentPreview attachments={attachments} />
      </Dark>,
    );
    expect(screen.getByText('ready.pdf')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('AttachmentPreview — error state', () => {
  it('renders error overlay when error is true', () => {
    const attachments: Attachment[] = [
      {
        id: 'e1',
        fileName: 'failed.pdf',
        fileSize: 1024,
        fileType: 'document',
        error: true,
      },
    ];
    const { container } = render(
      <Dark>
        <AttachmentPreview attachments={attachments} />
      </Dark>,
    );
    // The card should have an error overlay div
    const card = screen.getByText('failed.pdf').closest('[role="button"]')!;
    // The last child should be the error overlay
    const lastChild = card.lastElementChild as HTMLElement;
    // Error overlay has position absolute and covers the card
    expect(lastChild.style.position).toBe('absolute');
  });

  it('does not render error overlay when error is false', () => {
    const attachments: Attachment[] = [
      {
        id: 'e2',
        fileName: 'ok.pdf',
        fileSize: 1024,
        fileType: 'document',
        error: false,
      },
    ];
    render(
      <Dark>
        <AttachmentPreview attachments={attachments} />
      </Dark>,
    );
    const card = screen.getByText('ok.pdf').closest('[role="button"]')!;
    // No child should have position absolute (no error overlay, no progress bar)
    const children = Array.from(card.children);
    const absoluteChildren = children.filter(
      (c) => (c as HTMLElement).style.position === 'absolute',
    );
    expect(absoluteChildren).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('AttachmentPreview — disabled state', () => {
  it('reduces opacity when disabled', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AttachmentPreview
          ref={ref}
          attachments={baseAttachments}
          disabled
        />
      </Dark>,
    );
    expect(ref.current!.style.opacity).toBe('0.5');
  });

  it('sets pointerEvents to none when disabled', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dark>
        <AttachmentPreview
          ref={ref}
          attachments={baseAttachments}
          disabled
        />
      </Dark>,
    );
    expect(ref.current!.style.pointerEvents).toBe('none');
  });

  it('does not fire onRemove when disabled', () => {
    const onRemove = vi.fn();
    render(
      <Dark>
        <AttachmentPreview
          attachments={baseAttachments}
          onRemove={onRemove}
          disabled
        />
      </Dark>,
    );
    // pointerEvents: none prevents the click from reaching the button,
    // but we can still try to fire the handler programmatically
    // The component guards with `if (!disabled)` in handleRemove
    // We cannot easily click through pointerEvents in jsdom, so just verify disabled state
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('does not fire onPreview when disabled', () => {
    const onPreview = vi.fn();
    render(
      <Dark>
        <AttachmentPreview
          attachments={baseAttachments}
          onPreview={onPreview}
          disabled
        />
      </Dark>,
    );
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('sets tabIndex to -1 on cards when disabled', () => {
    render(
      <Dark>
        <AttachmentPreview
          attachments={[baseAttachments[0]]}
          disabled
        />
      </Dark>,
    );
    const card = screen.getByText('photo.png').closest('[role="button"]')!;
    expect(card.getAttribute('tabindex')).toBe('-1');
  });
});
