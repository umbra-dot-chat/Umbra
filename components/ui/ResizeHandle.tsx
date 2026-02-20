/**
 * ResizeHandle — Draggable edge handle for resizing panels.
 *
 * Place between two sibling panels in a horizontal (row) flex layout.
 * Uses native mouse events on web for smooth, glitch-free dragging.
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';

export interface ResizeHandleProps {
  /** Called continuously while dragging, with the incremental X delta. */
  onResize: (dx: number) => void;
  /** Called when the drag gesture ends. */
  onResizeEnd?: () => void;
}

export function ResizeHandle({ onResize, onResizeEnd }: ResizeHandleProps) {
  const { theme } = useTheme();
  const [dragging, setDragging] = useState(false);
  const lastXRef = useRef(0);
  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);
  onResizeRef.current = onResize;
  onResizeEndRef.current = onResizeEnd;

  // On web, use native mouse events for smooth, low-latency drag
  const handleRef = useRef<View>(null);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    lastXRef.current = e.clientX;
    setDragging(true);

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - lastXRef.current;
      if (dx !== 0) {
        onResizeRef.current(dx);
        lastXRef.current = ev.clientX;
      }
    };

    const onMouseUp = () => {
      setDragging(false);
      onResizeEndRef.current?.();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // react-native-web exposes the DOM node directly via ref
    const node = handleRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    node.addEventListener('mousedown', handleMouseDown);
    return () => node.removeEventListener('mousedown', handleMouseDown);
  }, [handleMouseDown]);

  return (
    <View
      ref={handleRef}
      style={{
        width: 5,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? { cursor: 'col-resize' } as any : {}),
        zIndex: 10,
      }}
    >
      {/* Visual indicator — thicker when dragging */}
      <View
        style={{
          width: dragging ? 2 : 1,
          height: '100%',
          backgroundColor: dragging ? theme.colors.accent.primary : 'transparent',
          borderRadius: 1,
        }}
      />
    </View>
  );
}
