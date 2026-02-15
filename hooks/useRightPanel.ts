import { useRef, useState, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { durations } from '@coexist/wisp-core';
import { PANEL_WIDTH } from '@/types/panels';
import type { RightPanel } from '@/types/panels';

export function useRightPanel() {
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [visiblePanel, setVisiblePanel] = useState<RightPanel>(null);
  const panelWidth = useRef(new Animated.Value(0)).current;
  const animatingRef = useRef(false);
  const rightPanelRef = useRef<RightPanel>(null);
  rightPanelRef.current = rightPanel;

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
        toValue: PANEL_WIDTH,
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
          toValue: PANEL_WIDTH,
          duration: durations.fast,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          animatingRef.current = false;
        });
      });
    }
  }, [panelWidth]);

  return { rightPanel, visiblePanel, panelWidth, togglePanel };
}
