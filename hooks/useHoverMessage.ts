import { useRef, useState, useCallback } from 'react';

export function useHoverMessage(delay = 150) {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHoverIn = useCallback((id: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredMessage(id);
  }, []);

  const handleHoverOut = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredMessage(null), delay);
  }, [delay]);

  return { hoveredMessage, handleHoverIn, handleHoverOut };
}
