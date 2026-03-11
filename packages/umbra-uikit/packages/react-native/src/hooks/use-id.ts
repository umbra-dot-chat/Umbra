import * as React from 'react';

let idCounter = 0;

function useFallbackId(): string {
  const ref = React.useRef<string | null>(null);
  if (ref.current === null) {
    ref.current = String(++idCounter);
  }
  return ref.current;
}

/**
 * Generates a unique, stable ID suitable for accessibility attributes.
 * Uses React 18's useId when available, falls back to monotonic counter.
 */
export function useId(prefix: string = 'wisp'): string {
  const reactUseId = (React as Record<string, unknown>).useId as
    | (() => string)
    | undefined;

  const react18Id = reactUseId ? reactUseId() : undefined;
  const fallbackId = useFallbackId();

  const uniquePart = react18Id ?? fallbackId;
  return `${prefix}-${uniquePart}`;
}
