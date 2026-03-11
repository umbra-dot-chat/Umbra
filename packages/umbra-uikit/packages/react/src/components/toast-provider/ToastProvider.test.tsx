/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from './ToastProvider';
import { WispProvider } from '../../providers';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const Dark = ({ children }: { children: React.ReactNode }) => (
  <WispProvider mode="dark">{children}</WispProvider>
);

// ---------------------------------------------------------------------------
// Helper component to trigger toasts
// ---------------------------------------------------------------------------

function ToastTrigger({ options }: { options?: Parameters<ReturnType<typeof useToast>['toast']>[0] }) {
  const { toast, dismiss, dismissAll } = useToast();
  return (
    <div>
      <button onClick={() => toast({ title: 'Test Toast', ...options })}>Show Toast</button>
      <button onClick={dismissAll}>Dismiss All</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ToastProvider — rendering', () => {
  it('renders children', () => {
    render(
      <Dark>
        <ToastProvider>
          <div>App Content</div>
        </ToastProvider>
      </Dark>,
    );
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// useToast hook
// ---------------------------------------------------------------------------

describe('ToastProvider — useToast', () => {
  it('throws when used outside of ToastProvider', () => {
    function BadComponent() {
      useToast();
      return null;
    }

    // Suppress console.error for the expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadComponent />)).toThrow(
      'useToast must be used within a <ToastProvider>',
    );
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Showing toasts
// ---------------------------------------------------------------------------

describe('ToastProvider — showing toasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast when toast() is called', () => {
    render(
      <Dark>
        <ToastProvider>
          <ToastTrigger />
        </ToastProvider>
      </Dark>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
  });

  it('shows description in toast', () => {
    render(
      <Dark>
        <ToastProvider>
          <ToastTrigger options={{ title: 'Hello', description: 'World' }} />
        </ToastProvider>
      </Dark>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('World')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Auto-dismiss
// ---------------------------------------------------------------------------

describe('ToastProvider — auto-dismiss', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-dismisses toast after duration', () => {
    render(
      <Dark>
        <ToastProvider>
          <ToastTrigger options={{ title: 'Vanishing', duration: 1000 }} />
        </ToastProvider>
      </Dark>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Vanishing')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.queryByText('Vanishing')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Dismiss all
// ---------------------------------------------------------------------------

describe('ToastProvider — dismiss all', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dismisses all toasts when dismissAll is called', () => {
    render(
      <Dark>
        <ToastProvider>
          <ToastTrigger options={{ title: 'Toast 1', duration: 0 }} />
        </ToastProvider>
      </Dark>,
    );

    fireEvent.click(screen.getByText('Show Toast'));
    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getAllByText('Toast 1')).toHaveLength(2);

    fireEvent.click(screen.getByText('Dismiss All'));
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Max limit
// ---------------------------------------------------------------------------

describe('ToastProvider — max limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes oldest toast when exceeding max', () => {
    let counter = 0;
    function Counter() {
      const { toast } = useToast();
      return (
        <button onClick={() => { counter++; toast({ title: `Toast ${counter}`, duration: 0 }); }}>
          Add
        </button>
      );
    }

    render(
      <Dark>
        <ToastProvider max={2}>
          <Counter />
        </ToastProvider>
      </Dark>,
    );

    fireEvent.click(screen.getByText('Add')); // Toast 1
    fireEvent.click(screen.getByText('Add')); // Toast 2
    fireEvent.click(screen.getByText('Add')); // Toast 3 — should evict Toast 1

    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });
});
