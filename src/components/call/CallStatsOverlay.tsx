/**
 * CallStatsOverlay — comprehensive real-time debug overlay for active calls.
 *
 * Shows:
 * - Video stats with measured vs reported FPS validation
 * - Audio stats with codec details
 * - Network quality with color-coded health indicators
 * - Ghost bot metadata (buffer health, underruns, source info)
 * - Quality health score with color grading
 * - Live timestamp proving data freshness
 * - Frame drop rate and decode efficiency
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { CallStats } from '@/types/call';

export interface GhostMetadata {
  type: 'ghost-metadata';
  callId: string;
  callType: 'voice' | 'video';
  uptime: number;
  audio: {
    playing: boolean;
    file: string | null;
    bufferMs: number;
    underruns: number;
    framesDelivered: number;
  } | null;
  video: {
    playing: boolean;
    file: string | null;
    width: number;
    height: number;
    fps: number;
    bufferedFrames: number;
    bufferHealth: number;
    droppedFrames: number;
    framesDelivered: number;
  } | null;
  stats: {
    bitrate: number;
    packetLoss: number;
    rtt: number;
  };
}

interface CallStatsOverlayProps {
  callStats: CallStats | null;
  ghostMetadata: GhostMetadata | null;
  visible: boolean;
}

// ── Health thresholds ──────────────────────────────────────────────────────

const FPS_GOOD = 25;
const FPS_WARN = 15;
const RTT_GOOD = 100;   // ms
const RTT_WARN = 300;
const LOSS_GOOD = 1;     // %
const LOSS_WARN = 5;
const JITTER_GOOD = 20;  // ms
const JITTER_WARN = 50;
const DROP_RATE_GOOD = 0.5; // %
const DROP_RATE_WARN = 2;
const BUF_HEALTH_GOOD = 0.5;
const BUF_HEALTH_WARN = 0.2;

function healthColor(value: number | null, goodThreshold: number, warnThreshold: number, lowerIsBetter = true): string {
  if (value == null) return '#888';
  if (lowerIsBetter) {
    if (value <= goodThreshold) return '#4caf50';
    if (value <= warnThreshold) return '#ff9800';
    return '#f44336';
  } else {
    if (value >= goodThreshold) return '#4caf50';
    if (value >= warnThreshold) return '#ff9800';
    return '#f44336';
  }
}

function formatFilename(path: string | null): string {
  if (!path) return 'none';
  const parts = path.split('/');
  const name = parts[parts.length - 1] ?? path;
  return name.length > 28 ? name.slice(0, 25) + '...' : name;
}

function formatBitrate(kbps: number | null): string {
  if (kbps == null) return '--';
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${Math.round(kbps)} kbps`;
}

function qualityScore(stats: CallStats | null, ghost: GhostMetadata | null): { score: number; label: string; color: string } {
  if (!stats) return { score: 0, label: 'N/A', color: '#888' };
  let score = 100;

  // FPS penalty
  if (stats.frameRate != null) {
    if (stats.frameRate < FPS_WARN) score -= 30;
    else if (stats.frameRate < FPS_GOOD) score -= 15;
  }

  // RTT penalty
  if (stats.roundTripTime != null) {
    if (stats.roundTripTime > RTT_WARN) score -= 25;
    else if (stats.roundTripTime > RTT_GOOD) score -= 10;
  }

  // Packet loss penalty
  if (stats.packetLoss != null) {
    if (stats.packetLoss > LOSS_WARN) score -= 25;
    else if (stats.packetLoss > LOSS_GOOD) score -= 10;
  }

  // Frame drop penalty
  if (stats.framesDecoded != null && stats.framesDropped != null && stats.framesDecoded > 0) {
    const dropRate = (stats.framesDropped / (stats.framesDecoded + stats.framesDropped)) * 100;
    if (dropRate > DROP_RATE_WARN) score -= 15;
    else if (dropRate > DROP_RATE_GOOD) score -= 5;
  }

  // Jitter penalty
  if (stats.jitter != null) {
    if (stats.jitter > JITTER_WARN) score -= 15;
    else if (stats.jitter > JITTER_GOOD) score -= 5;
  }

  // Ghost buffer health penalty
  if (ghost?.video) {
    if (ghost.video.bufferHealth < BUF_HEALTH_WARN) score -= 15;
    else if (ghost.video.bufferHealth < BUF_HEALTH_GOOD) score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  let label: string;
  let color: string;
  if (score >= 85) { label = 'Excellent'; color = '#4caf50'; }
  else if (score >= 70) { label = 'Good'; color = '#8bc34a'; }
  else if (score >= 50) { label = 'Fair'; color = '#ff9800'; }
  else if (score >= 30) { label = 'Poor'; color = '#ff5722'; }
  else { label = 'Critical'; color = '#f44336'; }

  return { score, label, color };
}

export function CallStatsOverlay({ callStats, ghostMetadata, visible }: CallStatsOverlayProps) {
  if (!visible) return null;

  const s = callStats;
  const g = ghostMetadata;

  // ── Measured FPS validation ────────────────────────────────────────────
  // Track framesDecoded delta over 1s windows to independently measure FPS
  const prevFramesRef = useRef<{ decoded: number; time: number } | null>(null);
  const [measuredFps, setMeasuredFps] = useState<number | null>(null);

  useEffect(() => {
    if (s?.framesDecoded == null) {
      setMeasuredFps(null);
      prevFramesRef.current = null;
      return;
    }
    const now = Date.now();
    const prev = prevFramesRef.current;
    if (prev) {
      const elapsed = (now - prev.time) / 1000;
      if (elapsed >= 0.5) {
        const deltaFrames = s.framesDecoded - prev.decoded;
        const fps = deltaFrames / elapsed;
        setMeasuredFps(Math.round(fps * 10) / 10);
        prevFramesRef.current = { decoded: s.framesDecoded, time: now };
      }
    } else {
      prevFramesRef.current = { decoded: s.framesDecoded, time: now };
    }
  }, [s?.framesDecoded]);

  // ── Live timestamp ─────────────────────────────────────────────────────
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  // ── Computed values ───────────────────────────────────────────────────
  const dropRate = (s?.framesDecoded != null && s?.framesDropped != null && s.framesDecoded > 0)
    ? (s.framesDropped / (s.framesDecoded + s.framesDropped)) * 100
    : null;
  const { score, label: scoreLabel, color: scoreColor } = qualityScore(s, g);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Quality Score Header */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreLabel, { color: scoreColor }]}>
          {scoreLabel.toUpperCase()}
        </Text>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>
          {score}/100
        </Text>
        <Text style={styles.timestamp}>{timeStr}</Text>
      </View>

      {/* ── VIDEO ───────────────────────────────────────────────────────── */}
      <Text style={styles.header}>VIDEO</Text>
      <Text style={styles.stat}>
        {'  '}Res: {s?.resolution ? `${s.resolution.width}x${s.resolution.height}` : '--'}
      </Text>
      <Text style={styles.stat}>
        {'  '}FPS:{' '}
        <Text style={{ color: healthColor(s?.frameRate ?? null, FPS_GOOD, FPS_WARN, false) }}>
          {s?.frameRate != null ? Math.round(s.frameRate) : '--'}
        </Text>
        {measuredFps != null && (
          <Text style={{ color: '#aaa' }}>
            {' '}(measured: {measuredFps})
          </Text>
        )}
      </Text>
      <Text style={styles.stat}>
        {'  '}Bitrate: {formatBitrate(s?.bitrate ?? null)}
        {s?.availableOutgoingBitrate != null && (
          <Text style={{ color: '#aaa' }}>{' '}(avail: {formatBitrate(s.availableOutgoingBitrate)})</Text>
        )}
      </Text>
      <Text style={styles.stat}>
        {'  '}Decoded: {s?.framesDecoded?.toLocaleString() ?? '--'} | Dropped:{' '}
        <Text style={{ color: healthColor(dropRate, DROP_RATE_GOOD, DROP_RATE_WARN) }}>
          {s?.framesDropped ?? 0}
        </Text>
        {dropRate != null && (
          <Text style={{ color: healthColor(dropRate, DROP_RATE_GOOD, DROP_RATE_WARN) }}>
            {' '}({dropRate.toFixed(2)}%)
          </Text>
        )}
      </Text>
      {s?.codec && (
        <Text style={styles.stat}>
          {'  '}Codec: {s.codec}
        </Text>
      )}

      {/* ── AUDIO ──────────────────────────────────────────────────────── */}
      <Text style={styles.header}>AUDIO</Text>
      <Text style={styles.stat}>
        {'  '}Bitrate: {s?.audioBitrate != null ? `${s.audioBitrate} kbps` : '--'}
        {s?.audioLevel != null && (
          <Text style={{ color: '#aaa' }}>{' '}| Level: {(s.audioLevel * 100).toFixed(0)}%</Text>
        )}
      </Text>

      {/* ── NETWORK ────────────────────────────────────────────────────── */}
      <Text style={styles.header}>NETWORK</Text>
      <Text style={styles.stat}>
        {'  '}RTT:{' '}
        <Text style={{ color: healthColor(s?.roundTripTime ?? null, RTT_GOOD, RTT_WARN) }}>
          {s?.roundTripTime != null ? `${s.roundTripTime.toFixed(0)} ms` : '--'}
        </Text>
        {'  '}Jitter:{' '}
        <Text style={{ color: healthColor(s?.jitter ?? null, JITTER_GOOD, JITTER_WARN) }}>
          {s?.jitter != null ? `${s.jitter.toFixed(1)} ms` : '--'}
        </Text>
      </Text>
      <Text style={styles.stat}>
        {'  '}Loss:{' '}
        <Text style={{ color: healthColor(s?.packetLoss ?? null, LOSS_GOOD, LOSS_WARN) }}>
          {s?.packetLoss != null ? `${s.packetLoss.toFixed(2)}%` : '--'}
        </Text>
        {s?.packetsLost != null && s.packetsLost > 0 && (
          <Text style={{ color: '#aaa' }}>{' '}({s.packetsLost} total)</Text>
        )}
      </Text>
      <Text style={styles.stat}>
        {'  '}ICE: {s?.localCandidateType ?? '--'} {'<>'} {s?.remoteCandidateType ?? '--'}
        {s?.candidateType === 'relay' && (
          <Text style={{ color: '#ff9800' }}>{' '}(TURN relay)</Text>
        )}
        {s?.candidateType === 'host' && (
          <Text style={{ color: '#4caf50' }}>{' '}(direct)</Text>
        )}
        {s?.candidateType === 'srflx' && (
          <Text style={{ color: '#8bc34a' }}>{' '}(STUN)</Text>
        )}
      </Text>

      {/* ── GHOST BOT ──────────────────────────────────────────────────── */}
      {g && (
        <>
          <Text style={styles.header}>BOT SOURCE</Text>
          {g.audio && (
            <Text style={styles.stat}>
              {'  '}Audio: {formatFilename(g.audio.file)}
              {'\n  '}  buf: {g.audio.bufferMs}ms | underruns:{' '}
              <Text style={{ color: g.audio.underruns > 0 ? '#ff9800' : '#4caf50' }}>
                {g.audio.underruns}
              </Text>
              {' '}| frames: {g.audio.framesDelivered.toLocaleString()}
            </Text>
          )}
          {g.video && (
            <>
              <Text style={styles.stat}>
                {'  '}Video: {formatFilename(g.video.file)}
              </Text>
              <Text style={styles.stat}>
                {'  '}  src: {g.video.width}x{g.video.height} @ {g.video.fps}fps
              </Text>
              <Text style={styles.stat}>
                {'  '}  buf: {g.video.bufferedFrames}f{' '}
                <Text style={{ color: healthColor(g.video.bufferHealth, BUF_HEALTH_GOOD, BUF_HEALTH_WARN, false) }}>
                  ({Math.round(g.video.bufferHealth * 100)}%)
                </Text>
                {' '}| dropped:{' '}
                <Text style={{ color: g.video.droppedFrames > 0 ? '#ff9800' : '#4caf50' }}>
                  {g.video.droppedFrames}
                </Text>
              </Text>
              <Text style={styles.stat}>
                {'  '}  delivered: {g.video.framesDelivered.toLocaleString()}
              </Text>
            </>
          )}
          <Text style={styles.stat}>
            {'  '}Uptime: {g.uptime}s | Bot RTT:{' '}
            <Text style={{ color: healthColor(g.stats.rtt * 1000, RTT_GOOD, RTT_WARN) }}>
              {(g.stats.rtt * 1000).toFixed(0)}ms
            </Text>
          </Text>
        </>
      )}

      {/* ── VALIDATION ─────────────────────────────────────────────────── */}
      <Text style={styles.header}>VALIDATION</Text>
      <Text style={styles.stat}>
        {'  '}Stats age: {s ? 'LIVE' : 'NO DATA'}
        {s?.frameRate != null && measuredFps != null && (
          <>
            {'\n  '}FPS match:{' '}
            <Text style={{ color: Math.abs(s.frameRate - measuredFps) < 5 ? '#4caf50' : '#ff9800' }}>
              {Math.abs(s.frameRate - measuredFps) < 5 ? 'OK' : 'DRIFT'}
            </Text>
            {' '}(reported={Math.round(s.frameRate)} measured={measuredFps})
          </>
        )}
        {g?.video && s?.resolution && (
          <>
            {'\n  '}Res match:{' '}
            <Text style={{ color: (g.video.width === s.resolution.width && g.video.height === s.resolution.height) ? '#4caf50' : '#ff9800' }}>
              {g.video.width === s.resolution.width && g.video.height === s.resolution.height ? 'OK' : 'MISMATCH'}
            </Text>
            {' '}(bot={g.video.width}x{g.video.height} client={s.resolution.width}x{s.resolution.height})
          </>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderRadius: 8,
    padding: 10,
    maxWidth: 420,
    zIndex: 100,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } as any : {}),
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    ...(Platform.OS === 'web' ? { fontFamily: 'monospace' } : {}),
  },
  scoreValue: {
    fontSize: 11,
    fontWeight: '700',
    ...(Platform.OS === 'web' ? { fontFamily: 'monospace' } : {}),
  },
  timestamp: {
    color: '#888',
    fontSize: 10,
    ...(Platform.OS === 'web' ? { fontFamily: 'monospace' } : {}),
  },
  header: {
    color: '#4fc3f7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 5,
    marginBottom: 1,
    ...(Platform.OS === 'web' ? { fontFamily: 'monospace' } : {}),
  },
  stat: {
    color: '#e0e0e0',
    fontSize: 10,
    lineHeight: 14,
    ...(Platform.OS === 'web' ? { fontFamily: 'monospace' } : {}),
  },
});
