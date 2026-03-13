/**
 * DebugVitalsOverlay — Floating debug widget showing real-time app vitals.
 *
 * Shows: heap usage, DOM nodes, render rate, listener counts, message rate.
 * Toggle with Ctrl+Shift+D. Draggable. Only rendered when __DEV__ is true.
 *
 * This is a raw React/DOM component (no Wisp) since it's dev-only debug tooling.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { dbg } from '@/utils/debug';
import type { CrashVitals } from '@/utils/debug';

// Only render on web in dev mode
const isWebDev = Platform.OS === 'web' && typeof __DEV__ !== 'undefined' && __DEV__;

interface VitalsSnapshot {
  heap: string;
  heapPct: string;
  heapDelta: string;
  domNodes: number;
  domDelta: number;
  renderRate: number;
  hotComponents: string[];
  msgRate: number;
  listenerBalance: number;
  svcListeners: Record<string, number>;
  nonFriendFails: number;
  lastError: string | null;
}

function readVitals(): VitalsSnapshot | null {
  try {
    const raw = localStorage.getItem('__umbra_vitals__');
    if (!raw) return null;
    const v: CrashVitals = JSON.parse(raw);
    const heapMB = (v.heap / 1024 / 1024).toFixed(1);
    const heapPct = v.heapLimit > 0 ? ((v.heap / v.heapLimit) * 100).toFixed(0) : '?';
    const heapDelta = (v.heapDelta / 1024 / 1024).toFixed(1);
    const hot = Object.entries(v.renderRates || {})
      .filter(([, r]) => r > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c, r]) => `${c}:${r}/s`);

    return {
      heap: `${heapMB}MB`,
      heapPct: `${heapPct}%`,
      heapDelta: `${Number(heapDelta) >= 0 ? '+' : ''}${heapDelta}MB`,
      domNodes: v.domNodes,
      domDelta: v.domDelta,
      renderRate: v.renderRate,
      hotComponents: hot,
      msgRate: v.messageEventRate,
      listenerBalance: v.globalListenerBalance,
      svcListeners: v.listenerCounts,
      nonFriendFails: v.nonFriendFailures,
      lastError: v.lastError,
    };
  } catch {
    return null;
  }
}

function OverlayContent() {
  const [vitals, setVitals] = useState<VitalsSnapshot | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 10, y: 10 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Poll vitals from localStorage every 2s (matches heartbeat)
  useEffect(() => {
    const update = () => setVitals(readVitals());
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  if (!vitals) return null;

  const heapPctNum = parseFloat(vitals.heapPct);
  const heapColor = heapPctNum > 85 ? '#f44336' : heapPctNum > 70 ? '#ff9800' : '#4caf50';
  const domColor = vitals.domNodes > 10000 ? '#f44336' : vitals.domNodes > 5000 ? '#ff9800' : '#4caf50';

  const svcStr = Object.entries(vitals.svcListeners)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');

  return (
    <div
      onMouseDown={onMouseDown}
      onClick={() => setExpanded(!expanded)}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.88)',
        color: '#e0e0e0',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.4,
        padding: '6px 10px',
        borderRadius: 6,
        cursor: 'grab',
        userSelect: 'none',
        minWidth: expanded ? 280 : 180,
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontWeight: 'bold', color: '#6366f1', marginBottom: 2 }}>
        VITALS {expanded ? '▾' : '▸'}
      </div>
      <div>
        Heap: <span style={{ color: heapColor }}>{vitals.heap} ({vitals.heapPct})</span>
        <span style={{ color: '#9e9e9e' }}> {vitals.heapDelta}/2s</span>
      </div>
      <div>
        DOM: <span style={{ color: domColor }}>{vitals.domNodes}</span>
        <span style={{ color: '#9e9e9e' }}> ({vitals.domDelta >= 0 ? '+' : ''}{vitals.domDelta})</span>
      </div>
      <div>
        Renders: <span style={{ color: vitals.renderRate > 10 ? '#f44336' : '#4caf50' }}>
          {vitals.renderRate}/s
        </span>
        {' '}Msgs: {vitals.msgRate}/2s
      </div>
      {expanded && (
        <>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 4, paddingTop: 4 }}>
            <div>Listeners (global): {vitals.listenerBalance}</div>
            {svcStr && <div>Svc: {svcStr}</div>}
            {vitals.nonFriendFails > 0 && (
              <div style={{ color: '#ff9800' }}>Non-friend fails: {vitals.nonFriendFails}</div>
            )}
            {vitals.hotComponents.length > 0 && (
              <div>
                Hot: <span style={{ color: '#ff9800' }}>{vitals.hotComponents.join(', ')}</span>
              </div>
            )}
            {vitals.lastError && (
              <div style={{ color: '#f44336', fontSize: 10, wordBreak: 'break-all' }}>
                Err: {vitals.lastError.slice(0, 100)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function DebugVitalsOverlay() {
  if (__DEV__) dbg.trackRender('DebugVitalsOverlay');
  const [visible, setVisible] = useState(false);

  // Toggle with Ctrl+Shift+D
  useEffect(() => {
    if (!isWebDev) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setVisible(v => !v);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!isWebDev || !visible) return null;
  return <OverlayContent />;
}
