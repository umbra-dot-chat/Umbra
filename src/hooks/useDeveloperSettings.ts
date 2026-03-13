import { useState, useEffect, useCallback } from 'react';
import { dbg } from '@/utils/debug';

const SRC = 'useDeveloperSettings';

export interface DeveloperSettings {
  /** Master switch for all diagnostic features */
  diagnosticsEnabled: boolean;
  /** Show real-time CallStatsOverlay during calls */
  statsOverlay: boolean;
  /** Log alerts when frame intervals drift >5ms */
  frameTimingAlerts: boolean;
  /** Log audio ring buffer state per frame */
  ringBufferLogging: boolean;
  /** Dump raw PCM/I420 to disk (high I/O) */
  rawMediaCapture: boolean;
  /** Log SDP codec negotiation on both sides */
  codecNegotiationLog: boolean;
  /** Enable frame counter + click track sync checks */
  avSyncValidation: boolean;
  /** Auto-capture state on quality degradation */
  degradationDetection: boolean;
  /** Replace media with 440Hz test tone */
  referenceSignalMode: boolean;
}

const STORAGE_PREFIX = 'umbra_dev_diag_';

const STORAGE_KEYS = {
  diagnosticsEnabled: `${STORAGE_PREFIX}enabled`,
  statsOverlay: `${STORAGE_PREFIX}stats_overlay`,
  frameTimingAlerts: `${STORAGE_PREFIX}frame_timing`,
  ringBufferLogging: `${STORAGE_PREFIX}ring_buffer`,
  rawMediaCapture: `${STORAGE_PREFIX}raw_capture`,
  codecNegotiationLog: `${STORAGE_PREFIX}codec_log`,
  avSyncValidation: `${STORAGE_PREFIX}av_sync`,
  degradationDetection: `${STORAGE_PREFIX}degradation`,
  referenceSignalMode: `${STORAGE_PREFIX}ref_signal`,
} as const;

const DEFAULTS: DeveloperSettings = {
  diagnosticsEnabled: false,
  statsOverlay: false,
  frameTimingAlerts: true,
  ringBufferLogging: true,
  rawMediaCapture: false,
  codecNegotiationLog: true,
  avSyncValidation: false,
  degradationDetection: true,
  referenceSignalMode: false,
};

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

export function useDeveloperSettings() {
  const [diagnosticsEnabled, setDiagnosticsEnabledState] = useState(DEFAULTS.diagnosticsEnabled);
  const [statsOverlay, setStatsOverlayState] = useState(DEFAULTS.statsOverlay);
  const [frameTimingAlerts, setFrameTimingAlertsState] = useState(DEFAULTS.frameTimingAlerts);
  const [ringBufferLogging, setRingBufferLoggingState] = useState(DEFAULTS.ringBufferLogging);
  const [rawMediaCapture, setRawMediaCaptureState] = useState(DEFAULTS.rawMediaCapture);
  const [codecNegotiationLog, setCodecNegotiationLogState] = useState(DEFAULTS.codecNegotiationLog);
  const [avSyncValidation, setAvSyncValidationState] = useState(DEFAULTS.avSyncValidation);
  const [degradationDetection, setDegradationDetectionState] = useState(DEFAULTS.degradationDetection);
  const [referenceSignalMode, setReferenceSignalModeState] = useState(DEFAULTS.referenceSignalMode);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setDiagnosticsEnabledState(readFromStorage(STORAGE_KEYS.diagnosticsEnabled, DEFAULTS.diagnosticsEnabled));
    setStatsOverlayState(readFromStorage(STORAGE_KEYS.statsOverlay, DEFAULTS.statsOverlay));
    setFrameTimingAlertsState(readFromStorage(STORAGE_KEYS.frameTimingAlerts, DEFAULTS.frameTimingAlerts));
    setRingBufferLoggingState(readFromStorage(STORAGE_KEYS.ringBufferLogging, DEFAULTS.ringBufferLogging));
    setRawMediaCaptureState(readFromStorage(STORAGE_KEYS.rawMediaCapture, DEFAULTS.rawMediaCapture));
    setCodecNegotiationLogState(readFromStorage(STORAGE_KEYS.codecNegotiationLog, DEFAULTS.codecNegotiationLog));
    setAvSyncValidationState(readFromStorage(STORAGE_KEYS.avSyncValidation, DEFAULTS.avSyncValidation));
    setDegradationDetectionState(readFromStorage(STORAGE_KEYS.degradationDetection, DEFAULTS.degradationDetection));
    setReferenceSignalModeState(readFromStorage(STORAGE_KEYS.referenceSignalMode, DEFAULTS.referenceSignalMode));
  }, []);

  const setDiagnosticsEnabled = useCallback((v: boolean) => {
    setDiagnosticsEnabledState(v);
    writeToStorage(STORAGE_KEYS.diagnosticsEnabled, v);
  }, []);

  const setStatsOverlay = useCallback((v: boolean) => {
    setStatsOverlayState(v);
    writeToStorage(STORAGE_KEYS.statsOverlay, v);
  }, []);

  const setFrameTimingAlerts = useCallback((v: boolean) => {
    setFrameTimingAlertsState(v);
    writeToStorage(STORAGE_KEYS.frameTimingAlerts, v);
  }, []);

  const setRingBufferLogging = useCallback((v: boolean) => {
    setRingBufferLoggingState(v);
    writeToStorage(STORAGE_KEYS.ringBufferLogging, v);
  }, []);

  const setRawMediaCapture = useCallback((v: boolean) => {
    setRawMediaCaptureState(v);
    writeToStorage(STORAGE_KEYS.rawMediaCapture, v);
  }, []);

  const setCodecNegotiationLog = useCallback((v: boolean) => {
    setCodecNegotiationLogState(v);
    writeToStorage(STORAGE_KEYS.codecNegotiationLog, v);
  }, []);

  const setAvSyncValidation = useCallback((v: boolean) => {
    setAvSyncValidationState(v);
    writeToStorage(STORAGE_KEYS.avSyncValidation, v);
  }, []);

  const setDegradationDetection = useCallback((v: boolean) => {
    setDegradationDetectionState(v);
    writeToStorage(STORAGE_KEYS.degradationDetection, v);
  }, []);

  const setReferenceSignalMode = useCallback((v: boolean) => {
    setReferenceSignalModeState(v);
    writeToStorage(STORAGE_KEYS.referenceSignalMode, v);
  }, []);

  return {
    diagnosticsEnabled,
    setDiagnosticsEnabled,
    statsOverlay,
    setStatsOverlay,
    frameTimingAlerts,
    setFrameTimingAlerts,
    ringBufferLogging,
    setRingBufferLogging,
    rawMediaCapture,
    setRawMediaCapture,
    codecNegotiationLog,
    setCodecNegotiationLog,
    avSyncValidation,
    setAvSyncValidation,
    degradationDetection,
    setDegradationDetection,
    referenceSignalMode,
    setReferenceSignalMode,
  };
}
