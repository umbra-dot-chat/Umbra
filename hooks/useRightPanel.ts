import { useRef, useState, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { durations } from '@coexist/wisp-core';
import { PANEL_WIDTH } from '@/types/panels';
import type { RightPanel } from '@/types/panels';

const PANEL_MIN = 220;
const PANEL_MAX = 500;

export function useRightPanel() {
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [visiblePanel, setVisiblePanel] = useState<RightPanel>(null);
  const panelWidth = useRef(new Animated.Value(0)).current;
  const animatingRef = useRef(false);
  const rightPanelRef = useRef<RightPanel>(null);
  rightPanelRef.current = rightPanel;

  // User-resizable target width (defaults to PANEL_WIDTH)
  const targetWidthRef = useRef(PANEL_WIDTH);
  const [panelContentWidth, setPanelContentWidth] = useState(PANEL_WIDTH);

  const togglePanel = useCallback((panel: NonNullable<RightPanel>) => {
    if (animatingRef.current) return;

    if (rightPanelRef.current === panel) {
      // Close the current panel
      setRightPanel(null);
      animatingRef.current = true;
      Animated.timing(panelWidth, {
        toValue: 0,
        duration: durations.fast,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        setVisiblePanel(null);
        animatingRef.current = false;
      });
    } else if (rightPanelRef.current === null) {
      // Open fresh
      setRightPanel(panel);
      setVisiblePanel(panel);
      animatingRef.current = true;
      Animated.timing(panelWidth, {
        toValue: targetWidthRef.current,
        duration: durations.fast,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        animatingRef.current = false;
      });
    } else {
      // Switch: close current, then open new
      animatingRef.current = true;
      setRightPanel(panel);
      Animated.timing(panelWidth, {
        toValue: 0,
        duration: durations.fast,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        setVisiblePanel(panel);
        Animated.timing(panelWidth, {
          toValue: targetWidthRef.current,
          duration: durations.fast,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          animatingRef.current = false;
        });
      });
    }
  }, [panelWidth]);

  /** Resize the panel by a delta (called during drag). Negative dx = wider panel (dragging left). */
  const resizePanel = useCallback((dx: number) => {
    // Dragging the handle left (negative dx) should widen the panel
    const newWidth = Math.min(PANEL_MAX, Math.max(PANEL_MIN, targetWidthRef.current - dx));
    targetWidthRef.current = newWidth;
    setPanelContentWidth(newWidth);
    if (rightPanelRef.current) {
      panelWidth.setValue(newWidth);
    }
  }, [panelWidth]);

  return { rightPanel, visiblePanel, panelWidth, togglePanel, resizePanel, panelContentWidth };
}
