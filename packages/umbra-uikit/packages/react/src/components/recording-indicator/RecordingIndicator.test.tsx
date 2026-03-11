/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecordingIndicator } from './RecordingIndicator';
import { WispProvider } from '../../providers';
import { recordingIndicatorVariants, recordingIndicatorSizes } from '@coexist/wisp-core/types/RecordingIndicator.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrap = (ui: React.ReactElement) =>
  render(<WispProvider mode="dark">{ui}</WispProvider>);

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('RecordingIndicator -- rendering', () => {
  it('renders without crashing', () => {
    wrap(<RecordingIndicator isRecording={true} />);
    expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
  });

  it('shows "Recording" text when recording', () => {
    wrap(<RecordingIndicator isRecording={true} />);
    expect(screen.getByText('Recording')).toBeInTheDocument();
  });

  it('shows "Not Recording" text when not recording', () => {
    wrap(<RecordingIndicator isRecording={false} />);
    expect(screen.getByText('Not Recording')).toBeInTheDocument();
  });

  it('has correct aria-label when recording', () => {
    wrap(<RecordingIndicator isRecording={true} />);
    expect(screen.getByTestId('recording-indicator')).toHaveAttribute(
      'aria-label',
      'Recording in progress',
    );
  });

  it('has correct aria-label when not recording', () => {
    wrap(<RecordingIndicator isRecording={false} />);
    expect(screen.getByTestId('recording-indicator')).toHaveAttribute(
      'aria-label',
      'Not recording',
    );
  });
});

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

describe('RecordingIndicator -- duration', () => {
  it('shows duration when recording with duration prop', () => {
    wrap(<RecordingIndicator isRecording={true} duration={125} />);
    expect(screen.getByTestId('recording-duration')).toHaveTextContent('02:05');
  });

  it('does not show duration when not recording', () => {
    wrap(<RecordingIndicator isRecording={false} duration={125} />);
    expect(screen.queryByTestId('recording-duration')).not.toBeInTheDocument();
  });

  it('formats zero seconds correctly', () => {
    wrap(<RecordingIndicator isRecording={true} duration={0} />);
    expect(screen.getByTestId('recording-duration')).toHaveTextContent('00:00');
  });

  it('formats minutes and seconds correctly', () => {
    wrap(<RecordingIndicator isRecording={true} duration={3661} />);
    expect(screen.getByTestId('recording-duration')).toHaveTextContent('61:01');
  });
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

describe('RecordingIndicator -- variants', () => {
  recordingIndicatorVariants.forEach((variant) => {
    it(`renders variant="${variant}" without crashing`, () => {
      wrap(<RecordingIndicator isRecording={true} variant={variant} />);
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('RecordingIndicator -- sizes', () => {
  recordingIndicatorSizes.forEach((size) => {
    it(`renders size="${size}" without crashing`, () => {
      wrap(<RecordingIndicator isRecording={true} size={size} />);
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Controls variant
// ---------------------------------------------------------------------------

describe('RecordingIndicator -- controls', () => {
  it('shows stop button when recording in controls variant', () => {
    const onStop = vi.fn();
    wrap(
      <RecordingIndicator
        isRecording={true}
        variant="controls"
        onStopRecording={onStop}
      />,
    );
    expect(screen.getByTestId('stop-recording-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('stop-recording-btn'));
    expect(onStop).toHaveBeenCalled();
  });

  it('shows start button when not recording with canRecord', () => {
    const onStart = vi.fn();
    wrap(
      <RecordingIndicator
        isRecording={false}
        variant="controls"
        canRecord={true}
        onStartRecording={onStart}
      />,
    );
    expect(screen.getByTestId('start-recording-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('start-recording-btn'));
    expect(onStart).toHaveBeenCalled();
  });

  it('does not show start button when canRecord is false', () => {
    wrap(
      <RecordingIndicator
        isRecording={false}
        variant="controls"
        canRecord={false}
        onStartRecording={() => {}}
      />,
    );
    expect(screen.queryByTestId('start-recording-btn')).not.toBeInTheDocument();
  });

  it('does not show buttons in badge variant', () => {
    wrap(
      <RecordingIndicator
        isRecording={true}
        variant="badge"
        onStopRecording={() => {}}
      />,
    );
    expect(screen.queryByTestId('stop-recording-btn')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Props forwarding
// ---------------------------------------------------------------------------

describe('RecordingIndicator -- props forwarding', () => {
  it('passes className through', () => {
    wrap(
      <RecordingIndicator
        isRecording={true}
        className="custom-class"
      />,
    );
    expect(screen.getByTestId('recording-indicator')).toHaveClass('custom-class');
  });
});
