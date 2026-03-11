/**
 * @module ToastProvider
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

export const toastPositions = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
  'top-center',
  'bottom-center',
] as const;

export type ToastPosition = (typeof toastPositions)[number];

// ---------------------------------------------------------------------------
// Toast options (passed to toast() call)
// ---------------------------------------------------------------------------

export interface ToastOptions {
  /** Toast variant (maps to the Toast primitive's variant). */
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  /** Title text. */
  title: string;
  /** Optional description text. */
  description?: string;
  /** Optional icon element. */
  icon?: React.ReactNode;
  /** Optional action element (e.g. a button). */
  action?: React.ReactNode;
  /** Auto-dismiss duration in ms. 0 = no auto-dismiss. @default 5000 */
  duration?: number;
  /** Optional custom ID for the toast. Auto-generated if omitted. */
  id?: string;
}

// ---------------------------------------------------------------------------
// Internal toast item (with generated id + timestamp)
// ---------------------------------------------------------------------------

export interface ToastItem extends ToastOptions {
  /** Unique ID for the toast instance. */
  id: string;
  /** Timestamp when the toast was created. */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

export interface ToastProviderProps {
  /**
   * Where toasts appear on screen.
   * @default 'bottom-right'
   */
  position?: ToastPosition;

  /**
   * Maximum number of visible toasts. Oldest dismissed when exceeded.
   * @default 5
   */
  max?: number;

  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseToastReturn {
  /** Show a new toast. Returns the toast ID. */
  toast: (options: ToastOptions) => string;
  /** Dismiss a specific toast by ID. */
  dismiss: (id: string) => void;
  /** Dismiss all toasts. */
  dismissAll: () => void;
}
