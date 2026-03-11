/**
 * @module ToastProvider
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type {
  ToastProviderProps,
  ToastOptions,
  ToastItem,
  ToastPosition,
  UseToastReturn,
} from '@coexist/wisp-core/types/ToastProvider.types';
import {
  buildToastContainerStyle,
  buildToastItemWrapperStyle,
} from '@coexist/wisp-core/styles/ToastProvider.styles';
import { Toast } from '../../primitives';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<UseToastReturn | null>(null);

/**
 * Hook to access toast methods. Must be used within a `<ToastProvider>`.
 */
export function useToast(): UseToastReturn {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// ID counter
// ---------------------------------------------------------------------------

let toastIdCounter = 0;

function generateToastId(): string {
  toastIdCounter += 1;
  return `wisp-toast-${toastIdCounter}`;
}

// ---------------------------------------------------------------------------
// ToastProvider
// ---------------------------------------------------------------------------

export function ToastProvider({
  position = 'bottom-right',
  max = 5,
  children,
}: ToastProviderProps) {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const toast = useCallback(
    (options: ToastOptions): string => {
      const id = options.id ?? generateToastId();
      const duration = options.duration ?? 5000;

      const item: ToastItem = {
        ...options,
        id,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        const next = [...prev, item];
        // Dismiss oldest if exceeding max
        if (next.length > max) {
          const removed = next.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      // Auto-dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [max, dismiss],
  );

  const ctx = useMemo(
    () => ({ toast, dismiss, dismissAll }),
    [toast, dismiss, dismissAll],
  );

  const containerStyle = useMemo(
    () => buildToastContainerStyle(position, theme),
    [position, theme],
  );

  const itemWrapperStyle = useMemo(
    () => buildToastItemWrapperStyle(),
    [],
  );

  // Reverse order for bottom positions so newest appears at the bottom
  const isBottom = position.startsWith('bottom');
  const orderedToasts = isBottom ? [...toasts] : [...toasts].reverse();

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div style={containerStyle}>
            {orderedToasts.map((t) => (
              <div key={t.id} style={itemWrapperStyle}>
                <Toast
                  variant={t.variant ?? 'default'}
                  title={t.title}
                  description={t.description}
                  icon={t.icon}
                  action={t.action}
                  onDismiss={() => dismiss(t.id)}
                />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

ToastProvider.displayName = 'ToastProvider';
