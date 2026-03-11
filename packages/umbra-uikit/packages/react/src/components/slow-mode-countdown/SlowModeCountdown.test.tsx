/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SlowModeCountdown } from './SlowModeCountdown';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Timer setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('SlowModeCountdown — rendering', () => {
  it('renders with role="timer"', () => {
    render(
      <Dark>
        <SlowModeCountdown remaining={10} />
      </Dark>,
    );
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('displays remaining seconds in inline mode', () => {
    render(
      <Dark>
        <SlowModeCountdown remaining={10} />
      </Dark>,
    );
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('displays formatted time for values over 60', () => {
    render(
      <Dark>
        <SlowModeCountdown remaining={90} />
      </Dark>,
    );
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('renders circular variant', () => {
    render(
      <Dark>
        <SlowModeCountdown remaining={30} variant="circular" />
      </Dark>,
    );
    expect(screen.getByRole('timer')).toBeInTheDocument();
    // The circular variant shows the number
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

describe('SlowModeCountdown — countdown', () => {
  it('decrements every second', () => {
    render(
      <Dark>
        <SlowModeCountdown remaining={5} />
      </Dark>,
    );

    expect(screen.getByText('5s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('4s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('3s')).toBeInTheDocument();
  });

  it('calls onComplete when reaching 0', () => {
    const onComplete = vi.fn();
    render(
      <Dark>
        <SlowModeCountdown remaining={2} onComplete={onComplete} />
      </Dark>,
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('stops at 0', () => {
    const onComplete = vi.fn();
    render(
      <Dark>
        <SlowModeCountdown remaining={1} onComplete={onComplete} />
      </Dark>,
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should only be called once even after extra time
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

describe('SlowModeCountdown — sizes', () => {
  it('renders sm size', () => {
    render(
      <Dark>
        <SlowModeCountdown remaining={10} size="sm" />
      </Dark>,
    );
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('renders lg size', () => {
    render(
      <Dark>
        <SlowModeCountdown remaining={10} size="lg" />
      </Dark>,
    );
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Aria
// ---------------------------------------------------------------------------

describe('SlowModeCountdown — accessibility', () => {
  it('has aria-label with remaining seconds', () => {
    render(
      <Dark>
        <SlowModeCountdown remaining={15} />
      </Dark>,
    );
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', '15 seconds remaining');
  });
});
