/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VideoGrid } from './VideoGrid';
import { WispProvider } from '../../providers';
import type { VideoParticipant } from '@coexist/wisp-core/types/VideoGrid.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrap = (ui: React.ReactElement) =>
  render(<WispProvider mode="dark">{ui}</WispProvider>);

const makeParticipants = (count: number): VideoParticipant[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p-${i}`,
    name: `User ${i}`,
  }));

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('VideoGrid -- rendering', () => {
  it('renders without crashing', () => {
    wrap(<VideoGrid participants={makeParticipants(4)} />);
    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
  });

  it('renders participant names', () => {
    wrap(<VideoGrid participants={makeParticipants(3)} />);
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('renders a single participant', () => {
    wrap(<VideoGrid participants={makeParticipants(1)} />);
    expect(screen.getByText('User 0')).toBeInTheDocument();
  });

  it('renders with empty participants', () => {
    wrap(<VideoGrid participants={[]} />);
    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Overflow
// ---------------------------------------------------------------------------

describe('VideoGrid -- overflow', () => {
  it('shows overflow count when participants exceed maxVisible', () => {
    wrap(<VideoGrid participants={makeParticipants(10)} maxVisible={5} />);
    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('hides overflow count when showOverflowCount is false', () => {
    wrap(
      <VideoGrid
        participants={makeParticipants(10)}
        maxVisible={5}
        showOverflowCount={false}
      />,
    );
    expect(screen.queryByText('+5')).not.toBeInTheDocument();
  });

  it('does not show overflow when below maxVisible', () => {
    wrap(<VideoGrid participants={makeParticipants(3)} maxVisible={25} />);
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('VideoGrid -- interactions', () => {
  it('calls onParticipantClick when a tile is clicked', () => {
    const onClick = vi.fn();
    wrap(
      <VideoGrid
        participants={makeParticipants(3)}
        onParticipantClick={onClick}
      />,
    );
    fireEvent.click(screen.getByLabelText('User 1'));
    expect(onClick).toHaveBeenCalledWith('p-1');
  });
});

// ---------------------------------------------------------------------------
// Spotlight layout
// ---------------------------------------------------------------------------

describe('VideoGrid -- spotlight layout', () => {
  it('renders in spotlight mode', () => {
    wrap(
      <VideoGrid
        participants={makeParticipants(4)}
        layout="spotlight"
        spotlightId="p-0"
      />,
    );
    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
    expect(screen.getByText('User 0')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Status indicators
// ---------------------------------------------------------------------------

describe('VideoGrid -- status indicators', () => {
  it('renders muted indicator', () => {
    const participants: VideoParticipant[] = [
      { id: '1', name: 'Muted User', isMuted: true },
    ];
    wrap(<VideoGrid participants={participants} />);
    expect(screen.getByLabelText('Muted')).toBeInTheDocument();
  });

  it('renders deafened indicator', () => {
    const participants: VideoParticipant[] = [
      { id: '1', name: 'Deaf User', isDeafened: true },
    ];
    wrap(<VideoGrid participants={participants} />);
    expect(screen.getByLabelText('Deafened')).toBeInTheDocument();
  });

  it('renders screen sharing indicator', () => {
    const participants: VideoParticipant[] = [
      { id: '1', name: 'Sharing User', isScreenSharing: true },
    ];
    wrap(<VideoGrid participants={participants} />);
    expect(screen.getByLabelText('Screen sharing')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

describe('VideoGrid -- skeleton', () => {
  it('renders skeleton with aria-hidden', () => {
    const { container } = wrap(
      <VideoGrid participants={[]} skeleton />,
    );
    const el = container.querySelector('[aria-hidden]');
    expect(el).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Props forwarding
// ---------------------------------------------------------------------------

describe('VideoGrid -- props forwarding', () => {
  it('passes className through', () => {
    wrap(
      <VideoGrid
        participants={makeParticipants(2)}
        className="custom-grid"
      />,
    );
    expect(screen.getByTestId('video-grid')).toHaveClass('custom-grid');
  });
});
